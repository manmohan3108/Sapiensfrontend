import { useEffect, useRef } from 'react';
import { Terminal, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { useSapiensStore } from '../../core/state/sapiensStore';
import { formatTime } from '../../utils/formatters';
import { Output as OutputType } from '../../types/sapiensTypes';

function OutputMessage({ output }: { output: OutputType }) {
  const bgColor = output.type === 'error' 
    ? 'bg-destructive/10 border-destructive/30' 
    : 'bg-card border-border';
  
  return (
    <div className={`p-4 rounded-lg border ${bgColor}`}>
      <div className="flex items-start gap-3">
        {output.type === 'error' && (
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm whitespace-pre-wrap break-words">
            {output.content}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {formatTime(output.timestamp)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function OutputConsole() {
  const outputs = useSapiensStore((state) => state.outputs);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new outputs are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [outputs]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Terminal className="w-5 h-5" />
          Output Console
        </CardTitle>
        <CardDescription>
          System responses and results
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div ref={scrollRef} className="p-6 pt-0 space-y-4">
            {outputs.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="text-center">
                  <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No output yet</p>
                  <p className="text-xs mt-1">Responses will appear here</p>
                </div>
              </div>
            ) : (
              outputs.map((output) => (
                <OutputMessage key={output.id} output={output} />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}