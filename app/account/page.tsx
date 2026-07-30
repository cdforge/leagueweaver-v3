import { AccountPanel } from "@/components/account/AccountPanel";

export default function AccountPage() {
  return <main className="account-page"><a className="account-brand" href="/"><img src="/branding/leagueweaver-mark.svg" alt="" /><span><strong>LEAGUE WEAVER</strong><small>COMMISSIONER STUDIO</small></span></a><AccountPanel /></main>;
}
