import { GoogleGenAI, Type } from "@google/genai";
import { ScheduleItem } from "../types";

// Ensure your environment variable is correctly named/accessible
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSchedule = async (
  promptText: string,
  employees: string[]
): Promise<ScheduleItem[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
            Create a weekly work schedule based on the following requirements:
            "${promptText}"
            
            Constraints:
            1. Max 8 hours per shift.
            2. Must include a 30 min break for shifts > 6 hours.
            3. Available employees: ${employees.join(", ")}.
            
            Return the schedule as a pure JSON array of shifts.
            Do NOT use comments in the JSON.
            Ensure every object in the array has 'id', 'employeeName', 'day', 'startTime', 'endTime', and 'role'.
          `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              employeeName: { type: Type.STRING },
              day: { type: Type.STRING },
              startTime: { type: Type.STRING },
              endTime: { type: Type.STRING },
              role: { type: Type.STRING }
            },
            required: ["id", "employeeName", "day", "startTime", "endTime", "role"]
          }
        }
      }
    });

    let jsonText = response.text || "[]";
    
    // 1. Clean up any potential markdown formatting from the AI response
    jsonText = jsonText.replace(/```json/g, "").replace(/```/g, "").trim();

    // 2. Extract only the JSON array part (in case there is leading/trailing text)
    const firstBracket = jsonText.indexOf('[');
    const lastBracket = jsonText.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1) {
      jsonText = jsonText.substring(firstBracket, lastBracket + 1);
    }

    // 3. Remove trailing commas which are invalid in JSON but common in LLM output
    // This regex looks for a comma followed by whitespace and a closing brace or bracket
    jsonText = jsonText.replace(/,(\s*[}\]])/g, (match, p1) => p1);

    const schedule: ScheduleItem[] = JSON.parse(jsonText);
    return schedule;
  } catch (error) {
    console.error("Error generating schedule:", error);
    return [];
  }
};