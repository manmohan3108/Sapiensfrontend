import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useSapiensStore } from '../core/state/sapiensStore';
import { sapiensService } from '../core/services/sapiensService';
import { CreateSapiensRequest, Sapiens } from '../types/sapiensTypes';
import { logger } from '../utils/logger';

/**
 * Custom hook for Sapiens operations
 * Provides high-level functions for working with Sapiens instances
 */
export function useSapiens() {
  const navigate = useNavigate();
  const {
    currentSapiens,
    setCurrentSapiens,
    setActivityLogs,
    setOutputs,
    setStatus,
    reset,
  } = useSapiensStore();

  /**
   * Create a new Sapiens instance
   */
  const createSapiens = useCallback(
    async (request: CreateSapiensRequest) => {
      try {
        setStatus('loading');

        const response = await sapiensService.createSapiens(request);

        const newSapiens: Sapiens = {
          id: response.sapiensId,
          name: response.name,
          role: response.role,
          createdAt: response.createdAt,
          lastModified: response.createdAt,
        };

        setCurrentSapiens(newSapiens);
        setStatus('idle');
        
        // Navigate to workspace
        navigate('/workspace');
        
        return newSapiens;
      } catch (error) {
        logger.error('Failed to create Sapiens', error);
        setStatus('error');
        throw error;
      }
    },
    [setStatus, setCurrentSapiens, navigate]
  );

  /**
   * Load an existing Sapiens instance
   * Sets the current Sapiens and navigates to workspace
   * Details like activity logs will be loaded in the workspace
   */
  const loadSapiens = useCallback(
    async (sapiens: Sapiens) => {
      try {
        setStatus('loading');

        // Set current Sapiens with available info
        setCurrentSapiens(sapiens);
        setStatus('idle');
        
        // Navigate to workspace immediately
        navigate('/workspace');
        
        return sapiens;
      } catch (error) {
        logger.error('Failed to load Sapiens', error);
        setStatus('error');
        throw error;
      }
    },
    [setStatus, setCurrentSapiens, navigate]
  );

  /**
   * Refresh Sapiens state from backend (activity logs and outputs)
   */
  const refreshSapiensState = useCallback(async () => {
    if (!currentSapiens) {
      logger.warn('No current Sapiens to refresh');
      return;
    }

    try {
      const state = await sapiensService.getSapiensState(currentSapiens.id);
      setActivityLogs(state.activityLogs);
      setOutputs(state.outputs);
    } catch (error) {
      logger.error('Failed to refresh Sapiens state', error);
    }
  }, [currentSapiens, setActivityLogs, setOutputs]);

  /**
   * Save the current Sapiens instance
   */
  const saveSapiens = useCallback(async () => {
    if (!currentSapiens) {
      logger.warn('No current Sapiens to save');
      return;
    }

    try {
      setStatus('loading');

      await sapiensService.saveSapiens({
        sapiensId: currentSapiens.id,
      });

      setStatus('idle');
      
      // Refresh state to get updated activity logs from backend
      await refreshSapiensState();
    } catch (error) {
      logger.error('Failed to save Sapiens', error);
      setStatus('error');
    }
  }, [currentSapiens, setStatus, refreshSapiensState]);

  /**
   * Upload files to the current Sapiens instance
   */
  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (!currentSapiens) {
        logger.warn('No current Sapiens for file upload');
        return;
      }

      try {
        setStatus('processing');

        await sapiensService.uploadFolder({
          sapiensId: currentSapiens.id,
          files,
        });

        setStatus('idle');
        
        // Refresh state to get updated activity logs from backend
        await refreshSapiensState();
      } catch (error) {
        logger.error('Failed to upload files', error);
        setStatus('error');
      }
    },
    [currentSapiens, setStatus, refreshSapiensState]
  );

  /**
   * Send text input to the current Sapiens instance
   */
  const sendTextInput = useCallback(
    async (text: string) => {
      if (!currentSapiens) {
        logger.warn('No current Sapiens for text input');
        return;
      }

      try {
        setStatus('processing');

        await sapiensService.sendTextInput({
          sapiensId: currentSapiens.id,
          text,
        });

        setStatus('idle');
        
        // Refresh state to get updated activity logs from backend
        await refreshSapiensState();
      } catch (error) {
        logger.error('Failed to send text input', error);
        setStatus('error');
      }
    },
    [currentSapiens, setStatus, refreshSapiensState]
  );

  /**
   * Return to home and reset state
   */
  const returnToHome = useCallback(() => {
    reset();
    navigate('/');
  }, [reset, navigate]);

  return {
    currentSapiens,
    createSapiens,
    loadSapiens,
    saveSapiens,
    uploadFiles,
    sendTextInput,
    refreshSapiensState,
    returnToHome,
  };
}