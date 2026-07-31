import { AccountPanel } from "@/components/account/AccountPanel";
import { AppHeader } from "@/components/AppHeader";

export default function AccountPage() {
  return <main className="account-page"><AppHeader /><div className="account-page-body"><AccountPanel /></div></main>;
}
