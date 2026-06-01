import { useCallback, useEffect, useRef, useState } from 'react';
import { ActionIcon, Center, Loader, Stack, Text } from '@mantine/core';
import { IconMaximize, IconMinimize } from '@tabler/icons-react';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import { erDiagramDefinition } from './erDiagramDefinition';
import classes from './ERDiagram.module.css';

// Mermaid is heavy, so we load it on demand and only initialize it once.
let mermaidPromise: Promise<typeof import('mermaid').default> | null = null;

function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({
        theme: 'neutral',
        themeVariables: {
          primaryColor: '#5e81ac',
          lineColor: '#81a1c1',
          textColor: '#2e3440',
          fontSize: '16px',
        },
        securityLevel: 'loose',
        startOnLoad: false,
        logLevel: 'error',
        flowchart: { htmlLabels: true, curve: 'basis' },
      });
      return mermaid;
    });
  }
  return mermaidPromise;
}

const ERDiagram = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);

  const renderDiagram = useCallback(async () => {
    const diagramElement = diagramRef.current;
    if (!diagramElement) {
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      const mermaid = await loadMermaid();

      // Clear any previously rendered SVG before re-running.
      diagramElement.querySelector('svg')?.remove();
      diagramElement.removeAttribute('data-processed');

      await mermaid.run({ nodes: [diagramElement] });

      if (!diagramElement.querySelector('svg')) {
        throw new Error('Diagram failed to render');
      }
    } catch {
      setError('Failed to render diagram');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    // Small delay so the diagram node is in the DOM before mermaid reads it.
    const timer = setTimeout(() => {
      if (mounted) {
        renderDiagram();
      }
    }, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [renderDiagram]);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => setError('Could not exit fullscreen'));
    } else {
      container.requestFullscreen().catch(() => setError('Could not enter fullscreen'));
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div ref={containerRef} className={`${classes.container} ${isFullscreen ? classes.fullscreen : ''}`}>
      <div className={classes.controls}>
        <ActionIcon
          variant="default"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? <IconMinimize size={18} /> : <IconMaximize size={18} />}
        </ActionIcon>
      </div>

      <div className={classes.viewport}>
        {isLoading && (
          <div className={classes.overlay}>
            <Stack align="center" gap="xs">
              <Loader color="#5e81ac" />
              <Text size="sm" c="dimmed">
                Generating diagram...
              </Text>
            </Stack>
          </div>
        )}

        {error && (
          <Center className={classes.overlay}>
            <Text c="red" size="sm">
              {error}
            </Text>
          </Center>
        )}

        <TransformWrapper initialScale={4} minScale={0.5} maxScale={10} wheel={{ step: 0.5 }}>
          <TransformComponent
            wrapperStyle={{ width: '100%', height: isFullscreen ? '100vh' : '100%' }}
          >
            <div
              ref={diagramRef}
              className={`mermaid ${classes.diagram} ${isFullscreen ? classes.diagramFullscreen : ''}`}
            >
              {erDiagramDefinition}
            </div>
          </TransformComponent>
        </TransformWrapper>
      </div>
    </div>
  );
};

export default ERDiagram;
