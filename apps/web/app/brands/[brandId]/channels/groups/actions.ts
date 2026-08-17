"use server";
import { redirect } from "next/navigation";
import { createChannelAccountGroupRequest, deleteChannelAccountGroupRequest, updateChannelAccountGroupRequest } from "../../../../../../src/lib/channel-account-groups-api";

const url = (brandId: string) => `/brands/${encodeURIComponent(brandId)}/channels/groups`;
const members = (form: FormData) => form.getAll("memberAccountIds").map(String).filter(Boolean);

export async function createGroupAction(brandId: string, form: FormData) {
  try {
    await createChannelAccountGroupRequest(brandId, { name: String(form.get("name") ?? ""), memberAccountIds: members(form) });
    redirect(`${url(brandId)}?notice=${encodeURIComponent("Account group created")}`);
  } catch (error) {
    redirect(`${url(brandId)}?error=${encodeURIComponent(error instanceof Error ? error.message : "Unable to create account group")}`);
  }
}

export async function updateGroupAction(brandId: string, groupId: string, form: FormData) {
  try {
    await updateChannelAccountGroupRequest(brandId, groupId, { name: String(form.get("name") ?? ""), memberAccountIds: members(form) });
    redirect(`${url(brandId)}?notice=${encodeURIComponent("Account group updated")}`);
  } catch (error) {
    redirect(`${url(brandId)}?error=${encodeURIComponent(error instanceof Error ? error.message : "Unable to update account group")}`);
  }
}

export async function deleteGroupAction(brandId: string, groupId: string) {
  try {
    await deleteChannelAccountGroupRequest(brandId, groupId);
    redirect(`${url(brandId)}?notice=${encodeURIComponent("Account group deleted")}`);
  } catch (error) {
    redirect(`${url(brandId)}?error=${encodeURIComponent(error instanceof Error ? error.message : "Unable to delete account group")}`);
  }
}
