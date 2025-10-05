"use client";

import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { CustomerSocketProvider } from "@/contexts/CustomerSocketContext";
import { MenuProvider } from "@/contexts/MenuContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ToastProvider } from "@/components/ui/Toast";
import { ConfirmDialogProvider } from "@/components/ui/ConfirmDialog";

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
      <LanguageProvider>
        <AuthProvider>
          <SocketProvider>
            <CustomerSocketProvider>
              <MenuProvider>
                <NotificationProvider>
                  <ToastProvider>
                    <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
                  </ToastProvider>
                </NotificationProvider>
              </MenuProvider>
            </CustomerSocketProvider>
          </SocketProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
