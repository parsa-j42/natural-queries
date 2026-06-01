export interface FieldInfo {
  type: string;
  description: string;
}

export interface TableData {
  description: string;
  fields: Record<string, FieldInfo>;
}

export interface SchemaData {
  tables: Record<string, TableData>;
}

export const schemaData: SchemaData = {
  tables: {
    Wells: {
      description: "Primary well location and identification information",
      fields: {
        Well_ID: { type: "Long Integer", description: "Primary key - Unique identifier for each well" },
        Drilling_Company_ID: { type: "Long Integer", description: "Reference to the company that drilled the well" },
        GIC_Well_ID: { type: "Long Integer", description: "Government issued identification number" },
        GOA_Well_Tag_Number: { type: "Text (7)", description: "Government of Alberta tracking number" },
        Longitude: { type: "Numeric (22, 8)", description: "Geographic longitude coordinate" },
        Latitude: { type: "Numeric (22, 8)", description: "Geographic latitude coordinate" },
        Elevation: { type: "Numeric (22, 8)", description: "Well elevation above sea level" },
        GPS_Obtained: { type: "Text (50)", description: "Method used to obtain GPS coordinates" },
        Township: { type: "Text (3)", description: "Township location identifier" },
        Range: { type: "Text (2)", description: "Range location identifier" },
        Meridian: { type: "Text (1)", description: "Meridian reference point" },
        Validated_Flag: { type: "Boolean", description: "Indicates if data has been validated" },
        Location_Locked_Flag: { type: "Boolean", description: "Indicates if location has been verified and locked" }
      }
    },
    Chemical_Analysis: {
      description: "Records of chemical testing performed on well water samples",
      fields: {
        Chemical_Analysis_ID: { type: "Long Integer", description: "Primary key for chemical analysis records" },
        Well_ID: { type: "Long Integer", description: "Reference to the well being tested" },
        Sample_Number: { type: "Text (7)", description: "Unique identifier for the sample" },
        Sample_Date: { type: "DateTime", description: "Date when the sample was collected" },
        Analysis_Date: { type: "DateTime", description: "Date when the analysis was performed" },
        Laboratory: { type: "Text (50)", description: "Name of the testing laboratory" },
        Water_Level: { type: "Numeric (18, 6)", description: "Water level at time of sampling" },
        Aquifer: { type: "Text (20)", description: "Aquifer from which sample was taken" },
        Well_Report_ID: { type: "Long Integer", description: "Reference to associated well report" }
      }
    },
    Analysis_Items: {
      description: "Individual chemical measurement results from water analysis",
      fields: {
        Element_Name: { type: "Text (50)", description: "Name of the chemical element tested" },
        Element_Symbol: { type: "Text (10)", description: "Chemical symbol of the element" },
        Decimal_Places: { type: "Long Integer", description: "Precision of measurement" },
        Value: { type: "Numeric (18, 6)", description: "Measured concentration value" },
        Chemical_Analysis_ID: { type: "Long Integer", description: "Reference to the chemical analysis record" }
      }
    },
    Well_Reports: {
      description: "Comprehensive reports on well construction and testing",
      fields: {
        Well_Report_ID: { type: "Long Integer", description: "Primary key for well reports" },
        Well_ID: { type: "Long Integer", description: "Reference to the well" },
        Well_Owner_ID: { type: "Long Integer", description: "Reference to well owner" },
        Driller_ID: { type: "Long Integer", description: "Reference to the driller" },
        Drilling_Company_ID: { type: "Long Integer", description: "Reference to drilling company" },
        Date_Received: { type: "DateTime", description: "Date report was received" },
        Drilling_Method: { type: "Text (50)", description: "Method used to drill the well" },
        Type_of_Work: { type: "Text (50)", description: "Category of work performed" },
        Total_Depth_Drilled: { type: "Numeric (18, 6)", description: "Total depth of drilling" },
        Finished_Well_Depth: { type: "Numeric (18, 6)", description: "Final depth of completed well" },
        Drilling_Start_Date: { type: "DateTime", description: "Start date of drilling" },
        Drilling_End_Date: { type: "DateTime", description: "Completion date of drilling" },
        Artesian_Flow_Flag: { type: "Boolean", description: "Indicates presence of artesian flow" },
        Pump_Installed_Flag: { type: "Boolean", description: "Indicates if pump was installed" }
      }
    },
    Well_Owners: {
      description: "Information about well ownership",
      fields: {
        Well_Owner_ID: { type: "Long Integer", description: "Primary key for well owner records" },
        Well_ID: { type: "Long Integer", description: "Reference to owned well" },
        Owner_Name: { type: "Text (70)", description: "Name of well owner" },
        PO_Box: { type: "Text (10)", description: "Post office box number" },
        Address: { type: "Text (40)", description: "Street address" },
        City: { type: "Text (20)", description: "City location" },
        Postal_Code: { type: "Text (7)", description: "Postal code" },
        Province: { type: "Text (30)", description: "Province/State" },
        Country: { type: "Text (50)", description: "Country" }
      }
    },
    Drilling_Companies: {
      description: "Information about well drilling companies",
      fields: {
        Drilling_Company_ID: { type: "Long Integer", description: "Primary key for drilling companies" },
        Company_Name: { type: "Text (60)", description: "Name of drilling company" },
        Street_Address: { type: "Text (40)", description: "Company street address" },
        City: { type: "Text (20)", description: "Company city location" },
        Province: { type: "Text (17)", description: "Company province/state" },
        Country: { type: "Text (50)", description: "Company country" },
        Postal_Code: { type: "Text (7)", description: "Company postal code" },
        e_Mail: { type: "Text (50)", description: "Company email contact" },
        Is_Active_Flag: { type: "Boolean", description: "Company active status" },
        Starting_Well_ID: { type: "Long Integer", description: "First well ID in company's range" },
        Last_Well_ID_Used: { type: "Long Integer", description: "Most recent well ID used" }
      }
    },
    Drillers: {
      description: "Information about individual well drillers",
      fields: {
        Driller_ID: { type: "Long Integer", description: "Primary key for drillers" },
        User_ID: { type: "Text (50)", description: "User system identifier" },
        Last_Name: { type: "Text (35)", description: "Driller's last name" },
        First_Name: { type: "Text (25)", description: "Driller's first name" },
        Middle_Initial: { type: "Text (2)", description: "Driller's middle initial" },
        Is_Active_Flag: { type: "Boolean", description: "Driller's active status" },
        Journeyman_Number: { type: "Text (15)", description: "Professional certification number" }
      }
    },
    Driller_Drilling_Company: {
      description: "Links between drillers and their employing companies",
      fields: {
        Drilling_Company_ID: { type: "Long Integer", description: "Reference to drilling company" },
        Driller_ID: { type: "Long Integer", description: "Reference to driller" },
        Effective_Date: { type: "DateTime", description: "Start date of employment" },
        Is_Active_Flag: { type: "Boolean", description: "Current employment status" }
      }
    },
    Pump_Tests: {
      description: "Records of well pump testing",
      fields: {
        Pump_Test_ID: { type: "Long Integer", description: "Primary key for pump tests" },
        Well_Report_ID: { type: "Long Integer", description: "Reference to well report" },
        Test_Date: { type: "DateTime", description: "Date of pump test" },
        Start_Time: { type: "DateTime", description: "Start time of test" },
        Static_Water_Level: { type: "Numeric (18, 2)", description: "Initial water level" },
        End_Water_Level: { type: "Numeric (18, 2)", description: "Final water level" },
        Water_Removal_Type: { type: "Text (50)", description: "Method of water removal" },
        Water_Removal_Rate: { type: "Numeric (18, 2)", description: "Rate of water removal" }
      }
    },
    Pump_Test_Items: {
      description: "Individual measurements from pump tests",
      fields: {
        Pump_Test_Item_ID: { type: "Long Integer", description: "Primary key for test measurements" },
        Pump_Test_ID: { type: "Long Integer", description: "Reference to pump test" },
        Minutes: { type: "Numeric (18, 2)", description: "Time of measurement" },
        Pumping_Depth: { type: "Numeric (18, 6)", description: "Depth during pumping" },
        Recovery_Depth: { type: "Numeric (18, 6)", description: "Depth during recovery" }
      }
    },
    Screens: {
      description: "Well screen installation details",
      fields: {
        Screen_ID: { type: "Long Integer", description: "Primary key for screen records" },
        Well_Report_ID: { type: "Long Integer", description: "Reference to well report" },
        GIC_Well_ID: { type: "Long Integer", description: "Government well ID" },
        From: { type: "Numeric (18, 6)", description: "Screen start depth" },
        To: { type: "Numeric (18, 6)", description: "Screen end depth" },
        Slot_Size: { type: "Numeric (18, 6)", description: "Screen slot size" }
      }
    },
    Lithologies: {
      description: "Geological layer information for wells",
      fields: {
        GIC_Well_ID: { type: "Long Integer", description: "Government well identifier" },
        Well_Report_ID: { type: "Long Integer", description: "Reference to well report" },
        Depth: { type: "Numeric (18, 6)", description: "Layer depth" },
        Water_Bearing: { type: "Boolean", description: "Indicates presence of water" },
        Colour: { type: "Text (50)", description: "Layer color" },
        Description: { type: "Text (50)", description: "Layer description" },
        Material: { type: "Text (50)", description: "Layer material type" }
      }
    },
    Geophysical_Logs: {
      description: "Well geophysical logging information",
      fields: {
        Geophysical_Log_ID: { type: "Long Integer", description: "Primary key for log records" },
        Well_Report_ID: { type: "Long Integer", description: "Reference to well report" },
        Log_Type: { type: "Text (50)", description: "Type of geophysical log" },
        Log_Taken_Flag: { type: "Boolean", description: "Indicates if log was taken" },
        Sent_to_AENV_Flag: { type: "Boolean", description: "Indicates if sent to environment agency" }
      }
    }
  }
};