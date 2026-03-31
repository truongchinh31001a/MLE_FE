"use client";

import { useState, useTransition } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Form,
  InputNumber,
  Progress,
  Row,
  Segmented,
  Select,
  Space,
  Statistic,
  Tag,
  Typography,
} from "antd";
import {
  BINARY_OPTIONS,
  buildCardioPayload,
  CARDIO_FORM_DEFAULTS,
  CARDIO_SAMPLE_PROFILES,
  CARDIO_THRESHOLD,
  deriveCardioMetrics,
  describePrediction,
  GENDER_OPTIONS,
  getRiskTone,
  LEVEL_3_OPTIONS,
} from "@/lib/cardio-model";

const { Title, Paragraph, Text } = Typography;

const toneMeta = {
  critical: {
    tagColor: "red",
    label: "Canh bao cao",
    accent: "#b6452c",
  },
  watch: {
    tagColor: "orange",
    label: "Vuot nguong model",
    accent: "#d2842f",
  },
  stable: {
    tagColor: "green",
    label: "Duoi nguong canh bao",
    accent: "#23725a",
  },
};

function FieldShell({ label, children, hint }) {
  return (
    <div className="rounded-[24px] border border-[rgba(107,73,46,0.1)] bg-white/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <Text className="text-[0.76rem] font-semibold uppercase tracking-[0.2em] !text-[#7a604a]">
          {label}
        </Text>
        {hint ? (
          <Text className="text-xs !text-[#8d7159]">{hint}</Text>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function MetricPill({ label, value, suffix, precision = 0 }) {
  return (
    <div className="rounded-[24px] border border-[rgba(107,73,46,0.08)] bg-[#fffaf3] p-4">
      <Text className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] !text-[#8c6d52]">
        {label}
      </Text>
      <div className="mt-2 text-3xl font-semibold tracking-tight text-[#241c16]">
        {value === null || value === undefined
          ? "--"
          : `${Number(value).toFixed(precision)}${suffix ?? ""}`}
      </div>
    </div>
  );
}

export default function PredictionStudio() {
  const [form] = Form.useForm();
  const [result, setResult] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const watchedValues = Form.useWatch([], form) ?? CARDIO_FORM_DEFAULTS;
  const derivedMetrics = deriveCardioMetrics(watchedValues);

  let payloadPreview = {
    ...watchedValues,
    ...derivedMetrics,
  };

  try {
    payloadPreview = buildCardioPayload(watchedValues);
  } catch {
    // Keep the partial preview visible while the user is typing.
  }

  const activeResult = result;
  const thresholdPercent = (
    (activeResult?.threshold_used ?? CARDIO_THRESHOLD) * 100
  ).toFixed(2);
  const probabilityPercent = Number(
    ((activeResult?.probability_cardio ?? 0) * 100).toFixed(1),
  );
  const tone = toneMeta[
    getRiskTone(
      activeResult?.probability_cardio,
      activeResult?.threshold_used ?? CARDIO_THRESHOLD,
    )
  ];

  async function handleSubmit(values) {
    setIsSubmitting(true);
    setApiError(null);

    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw data;
      }

      startTransition(() => {
        setResult(data);
      });
    } catch (error) {
      setResult(null);
      setApiError({
        message: error.message ?? "Khong the goi API du doan.",
        details: error.details ?? null,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function applySample(profileKey) {
    const profile = CARDIO_SAMPLE_PROFILES[profileKey];
    form.setFieldsValue(profile.values);
    setApiError(null);
  }

  function resetForm() {
    form.resetFields();
    setResult(null);
    setApiError(null);
  }

  return (
    <div className="risk-page min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-6">
          <div className="overflow-hidden rounded-[36px] border border-white/60 bg-[linear-gradient(135deg,rgba(255,249,241,0.94),rgba(244,231,212,0.9))] p-8 shadow-[0_28px_80px_rgba(108,76,52,0.18)] md:p-10">
            <div className="flex flex-wrap items-center gap-3">
              <Tag color="geekblue" className="!rounded-full !px-4 !py-1">
                XGBoost
              </Tag>
              <Tag color="gold" className="!rounded-full !px-4 !py-1">
                Threshold {thresholdPercent}%
              </Tag>
              <Tag color="default" className="!rounded-full !px-4 !py-1">
                /api/predict
              </Tag>
            </div>

            <Title
              level={1}
              className="!mb-4 !mt-6 !max-w-2xl !text-4xl !leading-[1.02] !font-semibold !tracking-tight !text-[#241c16] md:!text-6xl"
            >
              Form danh gia nguy co tim mach cho model da train.
            </Title>

            <Paragraph className="!mb-6 !max-w-2xl !text-base !leading-8 !text-[#5f4d3f] md:!text-lg">
              Giao dien nay goi toi <Text code>/api/predict</Text>. Route nay
              co the proxy sang prediction server rieng qua bien moi truong{" "}
              <Text code>CARDIO_SERVER_URL</Text>, hoac fallback ve Python local
              khi ban chua tach deploy. Model dang dung la{" "}
              <Text strong>cardio_xgboost_final.joblib</Text> de tra ve{" "}
              <Text code>probability_cardio</Text>,{" "}
              <Text code>prediction</Text>, va{" "}
              <Text code>threshold_used</Text>.
            </Paragraph>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="glass-card !rounded-[28px] !border-0">
                <Text className="eyebrow">Input toi gian</Text>
                <Paragraph className="!mb-0 !mt-3 !text-sm !leading-7 !text-[#6a5546]">
                  Nguoi dung chi can nhap 11 truong co ban. BMI, pulse pressure
                  va mean arterial pressure duoc tinh tu dong.
                </Paragraph>
              </Card>
              <Card className="glass-card !rounded-[28px] !border-0">
                <Text className="eyebrow">Output ro rang</Text>
                <Paragraph className="!mb-0 !mt-3 !text-sm !leading-7 !text-[#6a5546]">
                  Ket qua hien thi thanh muc, nhan nguong, JSON response va
                  payload cuoi cung ma model thuc su nhan.
                </Paragraph>
              </Card>
              <Card className="glass-card !rounded-[28px] !border-0">
                <Text className="eyebrow">Chay local ngay</Text>
                <Paragraph className="!mb-0 !mt-3 !text-sm !leading-7 !text-[#6a5546]">
                  Ban co the giu fallback local khi dev, hoac tro toi prediction
                  server rieng de deploy frontend va backend tach nhau.
                </Paragraph>
              </Card>
            </div>
          </div>

          <Card className="glass-card !rounded-[32px] !border-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Text className="eyebrow">Feature engineering</Text>
                <Title
                  level={3}
                  className="!mb-0 !mt-2 !text-2xl !text-[#241c16]"
                >
                  Gia tri tinh tu dong truoc khi goi model
                </Title>
              </div>
              <Space wrap>
                <Button onClick={() => applySample("baseline")}>
                  {CARDIO_SAMPLE_PROFILES.baseline.label}
                </Button>
                <Button onClick={() => applySample("elevated")}>
                  {CARDIO_SAMPLE_PROFILES.elevated.label}
                </Button>
              </Space>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <MetricPill
                label="BMI"
                value={derivedMetrics.bmi}
                precision={2}
              />
              <MetricPill
                label="Pulse Pressure"
                value={derivedMetrics.pulse_pressure}
              />
              <MetricPill
                label="Mean Arterial Pressure"
                value={derivedMetrics.mean_arterial_pressure}
                precision={2}
              />
            </div>

            <Divider />

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <Text className="eyebrow">Payload preview</Text>
                <Paragraph className="!mb-0 !mt-2 !text-sm !leading-7 !text-[#735e4d]">
                  Day la bo du lieu cuoi cung sau khi da chuan hoa va tinh them
                  feature suy dien.
                </Paragraph>
              </div>
              <Tag color="default" className="!rounded-full !px-4 !py-1">
                14 truong cho model
              </Tag>
            </div>

            <pre className="code-panel mt-4 overflow-x-auto">
{JSON.stringify(payloadPreview, null, 2)}
            </pre>
          </Card>
        </section>

        <section className="space-y-6">
          <Card className="glass-card sticky top-6 !rounded-[32px] !border-0">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <Text className="eyebrow">Prediction Console</Text>
                <Title
                  level={2}
                  className="!mb-0 !mt-2 !text-3xl !text-[#241c16]"
                >
                  Nhap thong tin benh nhan
                </Title>
              </div>
              <Text className="!text-sm !text-[#7f6854]">
                API se tu tinh feature suy dien truoc khi chay model.
              </Text>
            </div>

            <Form
              form={form}
              layout="vertical"
              initialValues={CARDIO_FORM_DEFAULTS}
              onFinish={handleSubmit}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <FieldShell label="Gioi tinh">
                    <Form.Item
                      name="gender"
                      className="!mb-0"
                      rules={[{ required: true, message: "Chon gioi tinh." }]}
                    >
                      <Select options={GENDER_OPTIONS} />
                    </Form.Item>
                  </FieldShell>
                </Col>
                <Col xs={24} md={12}>
                  <FieldShell label="Tuoi" hint="nam">
                    <Form.Item
                      name="age_years"
                      className="!mb-0"
                      rules={[{ required: true, message: "Nhap tuoi." }]}
                    >
                      <InputNumber
                        min={1}
                        max={120}
                        step={0.1}
                        controls={false}
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                  </FieldShell>
                </Col>

                <Col xs={24} md={12}>
                  <FieldShell label="Chieu cao" hint="cm">
                    <Form.Item
                      name="height"
                      className="!mb-0"
                      rules={[{ required: true, message: "Nhap chieu cao." }]}
                    >
                      <InputNumber
                        min={50}
                        max={260}
                        controls={false}
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                  </FieldShell>
                </Col>
                <Col xs={24} md={12}>
                  <FieldShell label="Can nang" hint="kg">
                    <Form.Item
                      name="weight"
                      className="!mb-0"
                      rules={[{ required: true, message: "Nhap can nang." }]}
                    >
                      <InputNumber
                        min={20}
                        max={250}
                        step={0.1}
                        controls={false}
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                  </FieldShell>
                </Col>

                <Col xs={24} md={12}>
                  <FieldShell label="Huyet ap tam thu" hint="ap_hi">
                    <Form.Item
                      name="ap_hi"
                      className="!mb-0"
                      rules={[
                        { required: true, message: "Nhap huyet ap tam thu." },
                      ]}
                    >
                      <InputNumber
                        min={60}
                        max={260}
                        controls={false}
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                  </FieldShell>
                </Col>
                <Col xs={24} md={12}>
                  <FieldShell label="Huyet ap tam truong" hint="ap_lo">
                    <Form.Item
                      name="ap_lo"
                      className="!mb-0"
                      rules={[
                        { required: true, message: "Nhap huyet ap tam truong." },
                      ]}
                    >
                      <InputNumber
                        min={40}
                        max={180}
                        controls={false}
                        style={{ width: "100%" }}
                      />
                    </Form.Item>
                  </FieldShell>
                </Col>

                <Col xs={24} md={12}>
                  <FieldShell label="Cholesterol">
                    <Form.Item
                      name="cholesterol"
                      className="!mb-0"
                      rules={[
                        {
                          required: true,
                          message: "Chon muc cholesterol.",
                        },
                      ]}
                    >
                      <Select options={LEVEL_3_OPTIONS} />
                    </Form.Item>
                  </FieldShell>
                </Col>
                <Col xs={24} md={12}>
                  <FieldShell label="Glucose">
                    <Form.Item
                      name="gluc"
                      className="!mb-0"
                      rules={[
                        { required: true, message: "Chon muc glucose." },
                      ]}
                    >
                      <Select options={LEVEL_3_OPTIONS} />
                    </Form.Item>
                  </FieldShell>
                </Col>

                <Col xs={24} md={8}>
                  <FieldShell label="Hut thuoc">
                    <Form.Item
                      name="smoke"
                      className="!mb-0"
                      rules={[{ required: true }]}
                    >
                      <Segmented block options={BINARY_OPTIONS} />
                    </Form.Item>
                  </FieldShell>
                </Col>
                <Col xs={24} md={8}>
                  <FieldShell label="Uong ruou">
                    <Form.Item
                      name="alco"
                      className="!mb-0"
                      rules={[{ required: true }]}
                    >
                      <Segmented block options={BINARY_OPTIONS} />
                    </Form.Item>
                  </FieldShell>
                </Col>
                <Col xs={24} md={8}>
                  <FieldShell label="Van dong">
                    <Form.Item
                      name="active"
                      className="!mb-0"
                      rules={[{ required: true }]}
                    >
                      <Segmented block options={BINARY_OPTIONS} />
                    </Form.Item>
                  </FieldShell>
                </Col>
              </Row>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isSubmitting || isPending}
                >
                  Du doan ngay
                </Button>
                <Button onClick={() => applySample("baseline")}>
                  Dien du lieu mau
                </Button>
                <Button onClick={resetForm}>Lam moi</Button>
              </div>
            </Form>
          </Card>

          {apiError ? (
            <Alert
              type="error"
              showIcon
              className="!rounded-[28px]"
              message={apiError.message}
              description={
                apiError.details ? (
                  <ul className="mt-2 list-disc pl-5">
                    {apiError.details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                ) : null
              }
            />
          ) : null}

          <Card className="glass-card !rounded-[32px] !border-0">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Text className="eyebrow">API Response</Text>
                <Title
                  level={3}
                  className="!mb-0 !mt-2 !text-2xl !text-[#241c16]"
                >
                  {activeResult ? "Ket qua du doan" : "Cho mot request moi"}
                </Title>
              </div>
              <Tag
                color={tone.tagColor}
                className="!rounded-full !px-4 !py-1 !text-sm"
              >
                {tone.label}
              </Tag>
            </div>

            <Paragraph className="!mb-0 !mt-4 !leading-8 !text-[#695546]">
              {describePrediction(activeResult)}
            </Paragraph>

            <div className="mt-6 rounded-[28px] border border-[rgba(107,73,46,0.1)] bg-[#fff8ef] p-5">
              <div className="flex items-center justify-between gap-4">
                <Text className="text-sm font-medium !text-[#7a5f4c]">
                  Probability Cardio
                </Text>
                <Text className="text-sm !text-[#7a5f4c]">
                  Threshold {thresholdPercent}%
                </Text>
              </div>
              <div className="mt-3 flex items-end justify-between gap-4">
                <div className="text-5xl font-semibold tracking-tight text-[#241c16]">
                  {probabilityPercent.toFixed(1)}%
                </div>
                <Text className="text-sm !text-[#8c7058]">
                  prediction = {activeResult?.prediction ?? "--"}
                </Text>
              </div>
              <Progress
                percent={probabilityPercent}
                showInfo={false}
                strokeColor={tone.accent}
                className="!mt-4"
              />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <Card className="soft-card !rounded-[24px] !border-0">
                <Statistic
                  title="Model"
                  value={activeResult?.model ?? "XGBoost"}
                />
              </Card>
              <Card className="soft-card !rounded-[24px] !border-0">
                <Statistic
                  title="Threshold"
                  value={Number(
                    activeResult?.threshold_used ?? CARDIO_THRESHOLD,
                  )}
                  precision={4}
                />
              </Card>
              <Card className="soft-card !rounded-[24px] !border-0">
                <Statistic
                  title="Prediction"
                  value={activeResult?.prediction ?? 0}
                />
              </Card>
            </div>

            <Divider />

            <div className="space-y-4">
              <div>
                <Text className="eyebrow">Raw response</Text>
                <pre className="code-panel mt-3 overflow-x-auto">
{JSON.stringify(
  activeResult ?? {
    probability_cardio: 0,
    prediction: 0,
    threshold_used: CARDIO_THRESHOLD,
  },
  null,
  2,
)}
                </pre>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
