import axios from "axios";
import type { GenerateProfileRequest, GenerateProfileResponse } from "models/aiProfile";

export async function generateProfileWithAi(
  request: GenerateProfileRequest
): Promise<GenerateProfileResponse> {
  const { data } = await axios.post<GenerateProfileResponse>("/api/ai/generate-profile", request, {
    timeout: 60000,
  });
  return data;
}
