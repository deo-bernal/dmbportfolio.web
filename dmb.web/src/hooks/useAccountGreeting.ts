import { useSelector } from "store";
import {
  firstNameFromFullName,
  readAccountFirstName,
} from "utils/accountGreeting";

export default function useAccountGreeting(): string {
  const profileName = useSelector((state) => state.user.profile?.name);
  return firstNameFromFullName(profileName || "") || readAccountFirstName();
}
