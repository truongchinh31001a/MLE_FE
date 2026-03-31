"use client";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App, ConfigProvider } from "antd";

const theme = {
  token: {
    colorPrimary: "#a3482f",
    colorInfo: "#a3482f",
    colorSuccess: "#23725a",
    colorWarning: "#d2842f",
    colorError: "#b6452c",
    colorTextBase: "#2d241d",
    colorBgBase: "#f7f0e4",
    borderRadius: 22,
    borderRadiusLG: 28,
    boxShadow:
      "0 22px 70px rgba(90, 57, 36, 0.12), 0 6px 24px rgba(90, 57, 36, 0.08)",
    fontFamily:
      "var(--font-space-grotesk), ui-sans-serif, system-ui, sans-serif",
  },
  components: {
    Card: {
      bodyPadding: 24,
    },
    Button: {
      controlHeight: 46,
      paddingInline: 20,
      fontWeight: 600,
    },
    InputNumber: {
      controlHeight: 46,
    },
    Select: {
      controlHeight: 46,
    },
    Segmented: {
      itemSelectedBg: "rgba(163, 72, 47, 0.14)",
      trackBg: "rgba(141, 101, 69, 0.08)",
    },
    Progress: {
      defaultColor: "#a3482f",
      remainingColor: "rgba(163, 72, 47, 0.12)",
    },
  },
};

export default function AntdProvider({ children }) {
  return (
    <AntdRegistry>
      <ConfigProvider theme={theme}>
        <App>{children}</App>
      </ConfigProvider>
    </AntdRegistry>
  );
}
