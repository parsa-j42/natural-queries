// Mermaid ER diagram for the well database. Theme is applied via mermaid.initialize
// in ERDiagram, so this only holds the entity/relationship definition.
export const erDiagramDefinition = `
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
`;
