"use server";

import { getAuthToken } from "../../app/(app)/api/lib/getAuthToken";
import { NEXT_PUBLIC_THIRDWEB_API_HOST } from "../constants/public-envs";

export async function reSubscribePlan(options: {
  teamId: string;
}): Promise<{ status: number }> {
  const token = await getAuthToken();
  if (!token) {
    return {
      status: 401,
    };
  }

  const res = await fetch(
    `${NEXT_PUBLIC_THIRDWEB_API_HOST}/v1/teams/${options.teamId}/checkout/resubscribe-plan`,
    {
      body: JSON.stringify({}),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      method: "PUT",
    },
  );

  if (!res.ok) {
    return {
      status: res.status,
    };
  }

  return {
    status: 200,
  };
}
