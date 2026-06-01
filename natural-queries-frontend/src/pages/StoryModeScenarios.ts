export const StoryScenarios = {
  singleStories: {
    beginner: [
      {
        title: "The Rusty Water Mystery",
        context: `Your first case as a water quality analyst just landed: residents in eastern Calgary (Townships 23-26) are reporting rusty, metallic-tasting water. Their complaints paint a concerning picture:

- "Our white laundry is getting rust stains"
- "The water tastes like metal"
- "Our sinks are developing reddish stains"

Your supervisor suspects high iron levels, which can cause:
- Staining and taste issues (> 0.3 mg/L)
- Infrastructure damage (> 1.0 mg/L)

Your task: Use our well monitoring database to investigate these reports and determine if this is an isolated issue or a broader problem requiring immediate action.`,
        difficulty: "beginner" as const,
        elements: ['well_locations', 'chemical_analysis'],
        skills: ['basic_select', 'joins'],
        prerequisites: [],
        steps: [
          {
            context: "To address these complaints, we need to identify which wells in the region are showing elevated iron levels. Finding the affected wells and their iron concentrations will help us determine whether this is a widespread issue or limited to specific areas.",
            task: "Find all wells in Townships 23-26 that have had iron testing in the past 6 months. Include their locations and categorize risk levels: Normal (≤0.3 mg/L), Moderate (0.3-1.0 mg/L), and High (>1.0 mg/L).",
            hint: "Start with the Wells table and connect it to recent Chemical_Analysis records. The iron measurements are in Analysis_Items.",
            solution: `
SELECT 
  W.Well_ID,
  W.Township,
  W.Range,
  CA.Sample_Date,
  AI.Value as Iron_Level,
  CASE 
    WHEN AI.Value > 1.0 THEN 'High'
    WHEN AI.Value > 0.3 THEN 'Moderate'
    ELSE 'Normal'
  END as Risk_Level
FROM Wells W
JOIN Chemical_Analysis CA ON W.Well_ID = CA.Well_ID
JOIN Analysis_Items AI ON CA.Chemical_Analysis_ID = AI.Chemical_Analysis_ID
WHERE AI.Element_Name = 'Iron'
  AND CA.Sample_Date >= DATEADD(month, -6, GETDATE())
  AND W.Township BETWEEN 23 AND 26
ORDER BY AI.Value DESC;`,
            explanation: {
              overview: "This query maps out which wells have concerning iron levels and where they're located",
              steps: [
                {
                  sql: "SELECT W.Well_ID, W.Township, W.Range",
                  explanation: "Get well locations so we can map the problem",
                  key_concept: "Basic SELECT statements"
                },
                {
                  sql: "JOIN Chemical_Analysis CA... JOIN Analysis_Items AI",
                  explanation: "Connect wells to their iron test results",
                  key_concept: "Table joining"
                },
                {
                  sql: "CASE WHEN AI.Value > 1.0 THEN 'High'",
                  explanation: "Label risk levels based on iron content",
                  key_concept: "Conditional logic"
                }
              ]
            }
          }
        ]
      }
    ]
  },
  multiChapterStories: {
    beginner: [
      {
        title: "Calgary's Water Quality Investigation",
        overall_context: `As a new Environmental Analyst at Alberta's Environmental Monitoring Division, you've inherited a concerning case: Several neighborhoods in eastern Calgary are reporting persistent water quality issues. Recent tests have shown abnormal chemical readings, and residents are growing increasingly worried.

Your supervisor has tasked you with a comprehensive investigation spanning the following areas:
1. Mapping the affected wells and identifying potentially vulnerable households
2. Analyzing well construction methods to spot any systematic issues
3. Correlating construction practices with water quality data

The results of your investigation will help guide new well construction standards and protect public health. Your database access gives you everything needed to uncover the source of these problems.`,
        difficulty: "beginner",
        elements: ['well_locations', 'chemical_analysis', 'well_ownership'],
        skills: ['basic_select', 'joins', 'aggregates'],
        chapters: [
          {
            title: "Mapping the Wells",
            introduction: `The first phase of your investigation focuses on understanding the scope of potential issues. Multiple complaints have come from Townships 23-26, but we need a clear picture of all wells in this area and their owners. Some neighborhoods show concerning patterns, with clusters of complaints coming from areas with similar well construction dates.

Our priorities for this phase:
- Create a comprehensive map of all wells in the affected townships
- Identify all well owners for potential notifications
- Look for areas with unusually high well density that might indicate development issues

The data you gather here will form the foundation for investigating whether certain areas or construction periods are more prone to problems.`,
            learning_objectives: [
              "Build complex well location queries",
              "Join ownership and location data",
              "Create density analysis summaries"
            ],
            steps: [{
              context: "Our investigation begins by creating a master database of all wells and their owners in Townships 23-26. Some neighborhoods have reported multiple issues, and we need to understand if there are patterns in well distribution or ownership that might explain these clusters.",
              task: "Create a comprehensive list showing all wells in the target townships, including owner contact details and precise well locations using section, township, and range references. Include only validated wells to ensure data accuracy.",
              hint: "You'll need to join the Wells and Well_Owners tables. Filter for validated wells in Townships 23-26.",
              solution: `
SELECT 
  W.Well_ID,
  W.Township,
  W.Range,
  W.Section,
  WO.Owner_Name,
  WO.Address,
  WO.City,
  WO.Postal_Code,
  CASE 
    WHEN W.Validated_Flag = 1 THEN 'Verified'
    ELSE 'Unverified'
  END as Status
FROM Wells W
JOIN Well_Owners WO ON W.Well_ID = WO.Well_ID
WHERE W.Township BETWEEN 23 AND 26
  AND W.Range BETWEEN 1 AND 4
  AND W.Validated_Flag = 1
ORDER BY W.Township, W.Range, W.Section;`,
              explanation: {
                overview: "This query maps out all verified wells and their owners, giving us our baseline for the investigation",
                steps: [
                  {
                    sql: "SELECT W.Well_ID, W.Township, W.Range, W.Section",
                    explanation: "Get precise location data",
                    key_concept: "Basic selection with multiple fields"
                  },
                  {
                    sql: "JOIN Well_Owners WO ON W.Well_ID = WO.Well_ID",
                    explanation: "Connect to owner information",
                    key_concept: "Table joining"
                  }
                ]
              }
            }],
            conclusion: "Now that we have a clear map of well locations and ownership, we can investigate how these wells were constructed and look for patterns in building methods that might explain the water quality issues."
          },
          {
            title: "Construction Methods Investigation",
            introduction: `With our well map complete, the next phase focuses on how these wells were built. Our preliminary analysis shows that wells constructed during certain time periods or using particular methods are more likely to show water quality issues.

The construction data raises several questions:
- Do certain drilling companies consistently use different methods?
- Are there patterns in construction depth or materials?
- Do wells built in the same period share similar characteristics?

Understanding these construction patterns could reveal why some areas are experiencing more problems than others, and help us establish better building standards for future wells.`,
            learning_objectives: [
              "Analyze complex construction data",
              "Compare building methods",
              "Identify contractor patterns"
            ],
            steps: [{
              context: "We need to analyze construction methods and materials across all wells in our target area. Some residents have reported that wells built by certain contractors or during specific time periods are showing more issues than others.",
              task: "Create a detailed summary of drilling companies, their methods, and material choices. Include the number of wells each company has built and their average depths to identify any unusual patterns.",
              hint: "Join Well_Reports with Drilling_Companies and use aggregation to summarize their methods.",
              solution: `
SELECT 
  DC.Company_Name,
  COUNT(DISTINCT WR.Well_ID) as Total_Wells,
  STRING_AGG(DISTINCT WR.Drilling_Method, ', ') as Methods_Used,
  STRING_AGG(DISTINCT WR.Casing_Material, ', ') as Casing_Materials,
  ROUND(AVG(WR.Total_Depth_Drilled), 2) as Avg_Well_Depth,
  MIN(WR.Drilling_Start_Date) as First_Well,
  MAX(WR.Drilling_Start_Date) as Latest_Well
FROM Well_Reports WR
JOIN Drilling_Companies DC ON WR.Drilling_Company_ID = DC.Drilling_Company_ID
WHERE WR.Well_ID IN (
  SELECT Well_ID 
  FROM Wells 
  WHERE Township BETWEEN 23 AND 26 
    AND Range BETWEEN 1 AND 4
)
GROUP BY DC.Company_Name
HAVING COUNT(DISTINCT WR.Well_ID) >= 3
ORDER BY Total_Wells DESC;`,
              explanation: {
                overview: "This analysis reveals patterns in how different companies construct their wells",
                steps: [
                  {
                    sql: "STRING_AGG(DISTINCT WR.Drilling_Method, ', ')",
                    explanation: "Aggregate methods by company",
                    key_concept: "String aggregation"
                  },
                  {
                    sql: "GROUP BY DC.Company_Name",
                    explanation: "Compare companies",
                    key_concept: "Data grouping"
                  }
                ]
              }
            }],
            conclusion: "The construction analysis shows clear patterns in building methods. Now we can examine how these different approaches might be affecting water quality."
          },
          {
            title: "Water Quality Impact Analysis",
            introduction: `In this final phase, we'll connect our findings about well locations and construction methods to actual water quality measurements. Several interesting patterns have emerged:

- Certain areas show consistently higher chemical concentrations
- Wells of similar depth tend to share quality characteristics
- Some construction methods appear to correlate with specific issues

By analyzing recent water quality tests alongside construction data, we can determine if particular building practices are contributing to these problems and recommend specific improvements for future well construction.`,
            learning_objectives: [
              "Correlate quality with construction",
              "Analyze temporal patterns",
              "Create summary reports"
            ],
            steps: [{
              context: "We need to analyze how water quality varies across different construction methods and materials. This will help us determine if certain building practices are more likely to lead to water quality issues.",
              task: "Create a comprehensive report showing average chemical levels grouped by drilling method and casing material. Include iron and hardness measurements as these have been particularly problematic.",
              hint: "Join Wells, Chemical_Analysis, and Analysis_Items tables, then group by construction methods.",
              solution: `
SELECT 
  WR.Drilling_Method,
  WR.Casing_Material,
  COUNT(DISTINCT W.Well_ID) as Well_Count,
  COUNT(DISTINCT CA.Chemical_Analysis_ID) as Tests_Performed,
  ROUND(AVG(CASE WHEN AI.Element_Name = 'Iron' THEN AI.Value END), 3) as Avg_Iron,
  ROUND(AVG(CASE WHEN AI.Element_Name = 'Hardness' THEN AI.Value END), 3) as Avg_Hardness,
  STRING_AGG(DISTINCT CA.Aquifer, ', ') as Affected_Aquifers
FROM Wells W
JOIN Well_Reports WR ON W.Well_ID = WR.Well_ID
JOIN Chemical_Analysis CA ON W.Well_ID = CA.Well_ID
JOIN Analysis_Items AI ON CA.Chemical_Analysis_ID = AI.Chemical_Analysis_ID
WHERE W.Township BETWEEN 23 AND 26
  AND CA.Sample_Date >= DATEADD(year, -1, GETDATE())
GROUP BY WR.Drilling_Method, WR.Casing_Material
HAVING COUNT(DISTINCT W.Well_ID) >= 3
ORDER BY Well_Count DESC;`,
              explanation: {
                overview: "This final analysis reveals how construction choices affect water quality",
                steps: [
                  {
                    sql: "CASE WHEN AI.Element_Name = 'Iron' THEN AI.Value END",
                    explanation: "Calculate element-specific averages",
                    key_concept: "Conditional aggregation"
                  },
                  {
                    sql: "GROUP BY WR.Drilling_Method, WR.Casing_Material",
                    explanation: "Compare different construction approaches",
                    key_concept: "Multi-factor grouping"
                  }
                ]
              }
            }],
            conclusion: "Our investigation has revealed clear connections between well construction methods and water quality, providing solid evidence for updating building standards and addressing resident concerns."
          }
        ]
      }
    ]
  }
}