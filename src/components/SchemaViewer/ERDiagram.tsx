import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { IconMaximize, IconMinimize } from '@tabler/icons-react';
import mermaid from 'mermaid';
import { ActionIcon, Text } from '@mantine/core';

let mermaidInitialized = false;

const ERDiagram = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const transformComponentRef = useRef(null);

  const initializeMermaid = useCallback(async () => {
    if (mermaidInitialized) {return true}

    try {
      await mermaid.initialize({
        theme: 'neutral',
        themeVariables: {
          primaryColor: '#5e81ac',
          lineColor: '#81a1c1',
          textColor: '#2e3440',
          fontSize: '16px',
        },
        securityLevel: 'loose',
        startOnLoad: true,
        logLevel: 'error',
        flowchart: {
          htmlLabels: true,
          curve: 'basis',
        },
      });
      mermaidInitialized = true;
      return true;
    } catch (err) {
      console.error('Error initializing mermaid:', err);
      setError('Failed to initialize diagram renderer');
      return false;
    }
  }, []);

  const renderDiagram = useCallback(async () => {
    const diagramElement = diagramRef.current;
    if (!diagramElement) {return}

    try {
      setIsLoading(true);
      setError('');

      // Clear previous content
      const previousSvg = diagramElement.querySelector('svg');
      if (previousSvg) {
        previousSvg.remove();
      }

      await mermaid.run({
        nodes: [diagramElement],
      });

      // Verify diagram was rendered
      const newSvg = diagramElement.querySelector('svg');
      if (!newSvg) {
        throw new Error('Diagram failed to render');
      }
    } catch (err) {
      console.error('Error rendering diagram:', err);
      setError('Failed to render diagram');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      const initialized = await initializeMermaid();
      if (initialized && mounted) {
        // Add a small delay to ensure DOM is ready
        setTimeout(() => {
          if (mounted) {
            renderDiagram();
          }
        }, 100);
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [initializeMermaid, renderDiagram]);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) {return}

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().catch(err => {
        console.error('Error attempting to exit fullscreen:', err);
      });
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col ${
        isFullscreen
          ? 'fixed inset-0 z-[9999] bg-white dark:bg-gray-900'
          : 'w-full h-full'
      }`}
      style={{
        minHeight: isFullscreen ? '100vh' : '100%',
      }}
    >
      {/* Controls container */}
      <div className="absolute top-4 right-4 z-10">
        <ActionIcon
          variant="light"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          className="bg-white dark:bg-gray-800 shadow-sm"
          m="md"
        >
          {isFullscreen ? <IconMinimize size={18} /> : <IconMaximize size={18} />}
        </ActionIcon>
      </div>

      {/* Main diagram container */}
      <div className="flex-1 relative min-h-0">
        {isLoading && (
          <div className="absolute inset-0 flex justify-center items-center bg-white/80 dark:bg-gray-900/80 z-10">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <Text size="sm" c="dimmed">
                Generating diagram...
              </Text>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex justify-center items-center">
            <Text c="red" size="sm">{error}</Text>
          </div>
        )}

        <TransformWrapper
          ref={transformComponentRef}
          initialScale={4}
          minScale={0.5}
          maxScale={10}
          wheel={{ step: 0.5 }}
        >
          <TransformComponent
            wrapperStyle={{
              width: '100%',
              height: isFullscreen ? '100vh' : '100%',
            }}
          >
            <div
              ref={diagramRef}
              className="mermaid w-full h-full"
              style={{
                padding: isFullscreen ? '2rem' : '1rem',
                minHeight: isFullscreen ? '100vh' : '600px', // Ensure minimum height in both modes
              }}
            >
              {`
%%{init: { 
  'theme': 'neutral', 
  'themeVariables': { 
    'primaryColor': '#5e81ac', 
    'lineColor': '#81a1c1', 
    'textColor': '#2e3440', 
    'fontSize': '16px' 
  }, 
  'flowchart': { 
    'diagramPadding': 50 
  } 
}}%% 
erDiagram
    Wells ||--o{ Chemical_Analysis : "has"
    Wells ||--o{ Well_Reports : "has"
    Wells ||--o{ Well_Owners : "owned_by"
    Wells ||--|| Drilling_Companies : "drilled_by"
    Chemical_Analysis ||--o{ Analysis_Items : "contains"
    Analysis_Items }o--|| Elements : "references"
    Drilling_Companies ||--o{ Driller_Drilling_Company : "employs"
    Drillers ||--o{ Driller_Drilling_Company : "works_for"
    Well_Reports ||--o{ Boreholes : "has"
    Well_Reports ||--o{ Geophysical_Logs : "has"
    Well_Reports ||--o{ Lithologies : "has"
    Well_Reports ||--o{ Pump_Tests : "has"
    Well_Reports ||--o{ Screens : "has"
    Well_Reports ||--o{ Other_Seals : "has"
    Well_Reports ||--o{ Perforations : "has"
    Well_Reports }o--|| Drillers : "created_by"
    Pump_Tests ||--o{ Pump_Test_Items : "has"

    Wells {
        Long_Integer Well_ID PK
        Long_Integer Drilling_Company_ID FK
        Long_Integer GIC_Well_ID
        Text GOA_Well_Tag_Number
        Numeric Longitude
        Numeric Latitude
        Numeric Elevation
        Text GPS_Obtained
        Text Elevation_Obtained
        Text Boundary_From
        Text LSD
        Text Section
        Text Township
        Text Range
        Text Meridian
        Boolean Validated_Flag
        Boolean Submitted_Flag
        Boolean Location_Locked_Flag
    }

    Chemical_Analysis {
        Long_Integer Chemical_Analysis_ID PK
        Long_Integer Well_ID FK
        Text Sample_Number
        DateTime Sample_Date
        DateTime Analysis_Date
        Text Laboratory
        Numeric Water_Level
        Text Aquifer
        Long_Integer Well_Report_ID FK
    }

    Analysis_Items {
        Text Element_Name FK
        Text Element_Symbol
        Long_Integer Decimal_Places
        Numeric Value
        Long_Integer Chemical_Analysis_ID FK
    }

    Elements {
        Long_Integer Element_ID PK
        Text Element_Name
        Text Element_Symbol
        Long_Integer Decimal_Places
    }

    Well_Reports {
        Long_Integer Well_Report_ID PK
        Long_Integer Well_ID FK
        Long_Integer Well_Owner_ID FK
        Long_Integer Driller_ID FK
        Long_Integer Drilling_Company_ID FK
        DateTime Drilling_Start_Date
        DateTime Drilling_End_Date
        Text Drilling_Method
        Numeric Total_Depth_Drilled
        Text Well_Use
        Boolean Artesian_Flow_Flag
        Boolean Pump_Installed_Flag
    }

    Well_Owners {
        Long_Integer Well_Owner_ID PK
        Long_Integer Well_ID FK
        Text Owner_Name
        Text Address
        Text City
        Text Province
        Text Country
        Text Postal_Code
    }

    Drilling_Companies {
        Long_Integer Drilling_Company_ID PK
        Text Company_Name
        Text Street_Address
        Text City
        Text Province
        Text Country
        Boolean Is_Active_Flag
        Long_Integer Last_Well_ID_Used
    }

    Drillers {
        Long_Integer Driller_ID PK
        Text User_ID
        Text Last_Name
        Text First_Name
        Boolean Is_Active_Flag
        Text Journeyman_Number
    }

    Driller_Drilling_Company {
        Long_Integer Drilling_Company_ID FK
        Long_Integer Driller_ID FK
        DateTime Effective_Date
        Boolean Is_Active_Flag
    }

    Pump_Tests {
        Long_Integer Pump_Test_ID PK
        Long_Integer Well_Report_ID FK
        DateTime Test_Date
        DateTime Start_Time
        Boolean Taken_From_Top_of_Casing
        Numeric Static_Water_Level
        Numeric End_Water_Level
        Text Water_Removal_Type
    }

    Pump_Test_Items {
        Long_Integer Pump_Test_Item_ID PK
        Long_Integer Pump_Test_ID FK
        Numeric Minutes
        Numeric Pumping_Depth
        Numeric Recovery_Depth
    }

    Screens {
        Long_Integer Screen_ID PK
        Long_Integer Well_Report_ID FK
        Long_Integer GIC_Well_ID FK
        Numeric From
        Numeric To
        Numeric Slot_Size
    }

    Lithologies {
        Long_Integer GIC_Well_ID FK
        Long_Integer Well_Report_ID FK
        Numeric Depth
        Boolean Water_Bearing
        Text Colour
        Text Description
        Text Material
    }

    Geophysical_Logs {
        Long_Integer Geophysical_Log_ID PK
        Long_Integer Well_Report_ID FK
        Text Log_Type
        Boolean Log_Taken_Flag
        Boolean Sent_to_AENV_Flag
    }

    Other_Seals {
        Long_Integer Other_Seal_ID PK
        Long_Integer Well_Report_ID FK
        Text Other_Seal_Type
        Numeric From
        Numeric To
        Numeric At
    }

    Perforations {
        Long_Integer Perforation_ID PK
        Long_Integer Well_Report_ID FK
        Numeric From
        Numeric To
        Numeric Diameter
        Numeric Interval
    }

    Boreholes {
        Long_Integer Well_Report_ID FK
        Long_Integer BoreHole_ID PK
        Numeric Diameter
        Numeric From
        Numeric To
    }
`}
            </div>
          </TransformComponent>
        </TransformWrapper>
      </div>
    </div>
  );
};

export default ERDiagram;