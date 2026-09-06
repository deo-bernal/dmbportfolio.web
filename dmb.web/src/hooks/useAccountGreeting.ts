import { useSelector } from "store";
import { readAccountFirstName } from "utils/accountGreeting";

export default function useAccountGreeting(): string {
  const accountFirstName = useSelector((state) => state.user.accountFirstName);
  return accountFirstName || readAccountFirstName();
}
