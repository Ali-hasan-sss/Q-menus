"use client";

import { ThemeProvider } from "next-themes";
import { ReduxProvider } from "@/components/providers/ReduxProvider";
import { SocketProvider } from "@/contexts/SocketContext";
import { CustomerSocketProvider } from "@/contexts/CustomerSocketContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { ConfirmDialogModal } from "@/components/ui/ConfirmDialogModal";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange={true}
      storageKey="theme"
    >
      <ReduxProvider>
        <SocketProvider>
          <CustomerSocketProvider>
            <NotificationProvider>
                {children}
                <ToastContainer />
                <ConfirmDialogModal />
              </NotificationProvider>
          </CustomerSocketProvider>
        </SocketProvider>
      </ReduxProvider>
    </ThemeProvider>
  );
}
