import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useSapiens } from '../../hooks/useSapiens';
import { useSapiensStore } from '../../core/state/sapiensStore';

export function TextInputPanel() {
  const [text, setText] = useState('');
  const { sendTextInput } = useSapiens();
  const status = useSapiensStore((state) => state.status);
  const isProcessing = status === 'processing';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim() || isProcessing) {
      return;
    }

    const inputText = text.trim();
    setText('');
    
    try {
      await sendTextInput(inputText);
    } catch (error) {
      console.error('Failed to send text input:', error);
      // Restore text on error
      setText(inputText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Text Input</CardTitle>
        <CardDescription>
          Send text queries and commands
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your text here..."
            className="flex-1 resize-none mb-4"
            disabled={isProcessing}
          />
          
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Press Cmd/Ctrl + Enter to send
            </p>
            <Button
              type="submit"
              disabled={!text.trim() || isProcessing}
            >
              <Send className="w-4 h-4 mr-2" />
              {isProcessing ? 'Processing...' : 'Send'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
