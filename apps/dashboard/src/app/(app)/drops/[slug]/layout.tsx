import { ErrorProvider } from "contexts/error-handler";
import { AppFooter } from "@/components/blocks/app-footer";

export default function DashboardLayout(props: { children: React.ReactNode }) {
  return (
    <ErrorProvider>
      <div className="flex min-h-dvh flex-col bg-background">
        {/* <DashboardHeader /> */}
        <div className="flex grow flex-col">{props.children}</div>
        <AppFooter />
      </div>
    </ErrorProvider>
  );
}
