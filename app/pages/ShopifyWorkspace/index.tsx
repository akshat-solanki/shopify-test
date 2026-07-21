import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import type {
  ShowcaseConfiguration,
  ShowcaseInstanceSummaryDto,
  ShopifyOnboardingBootstrapDto,
  ShopifyThemeSummary,
} from "../../../shared/contracts";
import type { StudioSettings } from "../../lib/studio-settings";
import { configurationFromStudioSettings, studioSettingsFromConfiguration } from "../../lib/studio-settings-mapping";
import { useShopifyThemes } from "../../hooks/useShopifyThemes";
import { useShowcaseInstances } from "../../hooks/useShowcaseInstances";
import { updateShowcaseInstanceConfiguration } from "../../services/showcaseInstances";
import { bootstrapThemeEditorShowcase } from "../../services/shopifyThemes";
import ProductShowcaseStudio from "../ProductShowcaseStudio";

type WorkspaceView = "onboarding" | "studio";

const shellStyles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(32, 129, 226, 0.14), transparent 28%), linear-gradient(180deg, #f7f9fc 0%, #eef3f8 100%)",
    color: "#18212f",
  },
  container: {
    maxWidth: 1240,
    margin: "0 auto",
    padding: "24px 20px 40px",
  },
  card: {
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(17,24,39,0.08)",
    borderRadius: 24,
    boxShadow: "0 20px 60px rgba(15, 23, 42, 0.08)",
    backdropFilter: "blur(10px)",
  },
} satisfies Record<string, CSSProperties>;

function getRoleLabel(role: ShopifyThemeSummary["role"]) {
  switch (role) {
    case "MAIN":
      return "Live";
    case "DEVELOPMENT":
      return "Development";
    case "UNPUBLISHED":
      return "Unpublished";
    case "DEMO":
      return "Demo";
    default:
      return role;
  }
}

function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" }) {
  const background = tone === "success" ? "#DCFCE7" : tone === "warning" ? "#FEF3C7" : "#E8EEF7";
  const color = tone === "success" ? "#166534" : tone === "warning" ? "#92400E" : "#355070";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.01em",
        background,
        color,
      }}
    >
      {children}
    </span>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label style={{ display: "grid", gap: 8 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#243244" }}>{label}</span>
      {children}
      {hint ? <span style={{ fontSize: 12, color: "#64748B" }}>{hint}</span> : null}
    </label>
  );
}

function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        borderRadius: 14,
        border: "1px solid rgba(17,24,39,0.12)",
        minHeight: 44,
        padding: "0 14px",
        fontSize: 14,
        color: "#0F172A",
        background: "#FFFFFF",
      }}
    />
  );
}

function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{
        borderRadius: 14,
        border: "1px solid rgba(17,24,39,0.12)",
        minHeight: 96,
        padding: "12px 14px",
        fontSize: 14,
        color: "#0F172A",
        background: "#FFFFFF",
        resize: "vertical",
      }}
    />
  );
}

function ThemeCard({
  theme,
  active,
  onSelect,
}: {
  theme: ShopifyThemeSummary;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        textAlign: "left",
        width: "100%",
        borderRadius: 20,
        border: active ? "1.5px solid #2081E2" : "1px solid rgba(17,24,39,0.08)",
        background: active ? "rgba(32,129,226,0.08)" : "#FFFFFF",
        padding: 18,
        cursor: "pointer",
        transition: "all 180ms ease",
        boxShadow: active ? "0 12px 30px rgba(32,129,226,0.12)" : "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>{theme.name}</div>
          <div style={{ marginTop: 6, fontSize: 13, color: "#526071" }}>
            Theme editor placement happens inside this theme. We’ll use the Apps section for drag and drop.
          </div>
        </div>
        <Pill tone={theme.role === "MAIN" ? "success" : "neutral"}>{getRoleLabel(theme.role)}</Pill>
      </div>
      <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 8 }}>
        <Pill tone={theme.supportsAppBlocks === "likely_supported" ? "success" : "warning"}>
          {theme.supportsAppBlocks === "likely_supported" ? "App block ready path" : "OS 2.0 check in editor"}
        </Pill>
        {theme.processing ? <Pill tone="warning">Still processing</Pill> : null}
      </div>
    </button>
  );
}

function SyncPanel({
  selectedInstance,
  initialSettings,
  onSave,
  isSaving,
  saveMessage,
}: {
  selectedInstance: ShowcaseInstanceSummaryDto | null;
  initialSettings: StudioSettings | null;
  onSave: (settings: StudioSettings) => void | Promise<void>;
  isSaving: boolean;
  saveMessage: string | null;
}) {
  if (!selectedInstance || !initialSettings) {
    return (
      <div style={{ ...shellStyles.card, padding: 24 }}>
        <div style={{ fontWeight: 700, color: "#0F172A" }}>App-instance sync</div>
        <div style={{ marginTop: 10, color: "#526071" }}>
          Create or select a showcase instance to bind the theme block to app-owned runtime settings.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div style={{ ...shellStyles.card, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#63748A" }}>
              App-instance sync
            </div>
            <div style={{ marginTop: 8, fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", color: "#0F172A" }}>
              Runtime-configured showcase instance
            </div>
            <div style={{ marginTop: 10, color: "#526071", maxWidth: 700 }}>
              Paste this instance ID into the theme block’s `Instance ID` setting. After that, the storefront block will load
              its products and presentation from app-owned runtime data through the app proxy.
            </div>
          </div>
          <Pill tone="success">Instance-bound runtime</Pill>
        </div>

        <div style={{ marginTop: 18, padding: 16, borderRadius: 18, background: "#F8FAFC", border: "1px solid rgba(148,163,184,0.28)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Theme block value
          </div>
          <div style={{ marginTop: 8, fontSize: 15, color: "#0F172A" }}>
            `Instance ID`: <code>{selectedInstance.instance.instanceId}</code>
          </div>
          <div style={{ marginTop: 6, fontSize: 13, color: "#526071" }}>
            Placement key: <code>{selectedInstance.themeConfiguration?.placementKey ?? "pending"}</code>
          </div>
        </div>
      </div>

      <ProductShowcaseStudio embedded initialSettings={initialSettings} onSave={onSave} isSaving={isSaving} saveMessage={saveMessage} />
    </div>
  );
}

function OnboardingPanel({
  selectedTheme,
  selectedInstance,
  instances,
  onSelectInstance,
  onOpenThemeEditor,
  bootstrapResult,
  isBootstrapping,
  onBootstrap,
  instancesLoading,
}: {
  selectedTheme: ShopifyThemeSummary | null;
  selectedInstance: ShowcaseInstanceSummaryDto | null;
  instances: ShowcaseInstanceSummaryDto[];
  onSelectInstance: (instanceId: string) => void;
  onOpenThemeEditor: () => void;
  bootstrapResult: ShopifyOnboardingBootstrapDto | null;
  isBootstrapping: boolean;
  onBootstrap: () => void;
  instancesLoading: boolean;
}) {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div style={{ ...shellStyles.card, padding: 28 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <Pill tone="success">Pass 2 live</Pill>
          <Pill>Merchant onboarding</Pill>
          <Pill>App-owned instance sync</Pill>
          <Pill>Theme editor block</Pill>
        </div>
        <h1 style={{ margin: "16px 0 10px", fontSize: 40, lineHeight: 1, letterSpacing: "-0.04em" }}>
          Bind the theme block to an app-owned showcase instance
        </h1>
        <p style={{ margin: 0, maxWidth: 760, fontSize: 16, lineHeight: 1.6, color: "#516072" }}>
          The block now supports instance-based runtime sync. Merchants can keep using drag and drop in the theme editor,
          while the actual showcase content and layout settings live in your app and load through the Shopify app proxy.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 20 }}>
          <button
            type="button"
            onClick={onOpenThemeEditor}
            disabled={!selectedTheme}
            style={{
              border: "none",
              borderRadius: 999,
              background: "#111827",
              color: "#FFFFFF",
              padding: "14px 18px",
              fontWeight: 700,
              cursor: selectedTheme ? "pointer" : "not-allowed",
            }}
          >
            Open theme editor
          </button>
          <button
            type="button"
            onClick={onBootstrap}
            disabled={!selectedTheme || isBootstrapping}
            style={{
              border: "1px solid rgba(17,24,39,0.12)",
              borderRadius: 999,
              background: "#FFFFFF",
              color: "#111827",
              padding: "14px 18px",
              fontWeight: 700,
              cursor: selectedTheme ? "pointer" : "not-allowed",
            }}
          >
            {isBootstrapping ? "Preparing showcase instance..." : "Create synced showcase instance"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 18 }}>
        <div style={{ ...shellStyles.card, padding: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#63748A" }}>
            Merchant steps
          </div>
          <div style={{ marginTop: 18, display: "grid", gap: 16 }}>
            {[
              "Choose or create a showcase instance in the app.",
              "Set the collection handle and layout in the app-owned instance settings below.",
              "Open the theme editor, add the Vypari block, and paste the instance ID into the block setting.",
              "Drag the block anywhere the section allows, save, and the storefront will render from app proxy runtime data.",
            ].map((step, index) => (
              <div key={step} style={{ display: "grid", gridTemplateColumns: "40px 1fr", gap: 14, alignItems: "start" }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    background: "#E8F1FC",
                    color: "#1D4ED8",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 800,
                  }}
                >
                  {index + 1}
                </div>
                <div style={{ paddingTop: 8, fontSize: 15, color: "#213143" }}>{step}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...shellStyles.card, padding: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#63748A" }}>
            Showcase instances
          </div>
          <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
            {instancesLoading ? <Pill>Loading instances...</Pill> : null}
            {!instancesLoading && !instances.length ? (
              <div style={{ fontSize: 14, color: "#526071" }}>No showcase instances yet. Create one to start syncing the theme block.</div>
            ) : null}
            {instances.map((entry) => {
              const active = selectedInstance?.instance.instanceId === entry.instance.instanceId;
              return (
                <button
                  key={entry.instance.instanceId}
                  type="button"
                  onClick={() => onSelectInstance(entry.instance.instanceId)}
                  style={{
                    textAlign: "left",
                    borderRadius: 18,
                    border: active ? "1.5px solid #2081E2" : "1px solid rgba(17,24,39,0.08)",
                    background: active ? "rgba(32,129,226,0.08)" : "#FFFFFF",
                    padding: 14,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: 700, color: "#0F172A" }}>{entry.instance.instanceId}</div>
                  <div style={{ marginTop: 6, fontSize: 13, color: "#526071" }}>
                    Collection: <code>{entry.instance.configuration.source.collectionHandle || "not set"}</code>
                  </div>
                  <div style={{ marginTop: 4, fontSize: 13, color: "#526071" }}>
                    Layout: {entry.instance.configuration.source.layout} · Products: {entry.instance.configuration.source.productsToShow}
                  </div>
                </button>
              );
            })}
          </div>

          {bootstrapResult ? (
            <div
              style={{
                marginTop: 18,
                padding: 16,
                borderRadius: 18,
                background: "#F8FAFC",
                border: "1px solid rgba(148,163,184,0.28)",
              }}
            >
              <div style={{ fontWeight: 700, color: "#0F172A" }}>Bootstrap complete</div>
              <div style={{ marginTop: 8, fontSize: 13, color: "#526071" }}>
                Instance: <code>{bootstrapResult.instance.instanceId}</code>
              </div>
              <div style={{ marginTop: 4, fontSize: 13, color: "#526071" }}>
                Placement: <code>{bootstrapResult.themeConfiguration.placementKey}</code>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function ShopifyWorkspacePage() {
  const { themes, isLoading, error } = useShopifyThemes();
  const { instances, isLoading: instancesLoading, error: instancesError, refresh } = useShowcaseInstances();
  const [view, setView] = useState<WorkspaceView>("onboarding");
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [bootstrapResult, setBootstrapResult] = useState<ShopifyOnboardingBootstrapDto | null>(null);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [isSavingSync, setIsSavingSync] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const search = useMemo(() => new URLSearchParams(window.location.search), []);
  const installationSuccess = search.get("installation") === "success";

  useEffect(() => {
    if (!themes.length) return;
    if (selectedThemeId && themes.some((theme) => theme.id === selectedThemeId)) return;

    const preferredTheme = themes.find((theme) => theme.role === "MAIN") ?? themes[0];
    setSelectedThemeId(preferredTheme.id);
  }, [themes, selectedThemeId]);

  useEffect(() => {
    if (!instances.length) {
      setSelectedInstanceId(null);
      return;
    }

    if (selectedInstanceId && instances.some((entry) => entry.instance.instanceId === selectedInstanceId)) {
      return;
    }

    setSelectedInstanceId(instances[0].instance.instanceId);
  }, [instances, selectedInstanceId]);

  const selectedTheme = themes.find((theme) => theme.id === selectedThemeId) ?? null;
  const selectedInstance = instances.find((entry) => entry.instance.instanceId === selectedInstanceId) ?? null;
  const initialStudioSettings = useMemo(
    () => (selectedInstance ? studioSettingsFromConfiguration(selectedInstance.instance.configuration as ShowcaseConfiguration) : null),
    [selectedInstance],
  );

  async function handleBootstrap() {
    try {
      setIsBootstrapping(true);
      setBootstrapError(null);
      const result = await bootstrapThemeEditorShowcase(selectedTheme?.themeId);
      setBootstrapResult(result);
      await refresh();
      setSelectedInstanceId(result.instance.instanceId);
      setSyncMessage("Synced showcase instance created.");
    } catch (loadError) {
      setBootstrapError(loadError instanceof Error ? loadError.message : "Unable to prepare showcase");
    } finally {
      setIsBootstrapping(false);
    }
  }

  async function handleSaveSync(settings: StudioSettings) {
    if (!selectedInstance) return;

    try {
      setIsSavingSync(true);
      setSyncError(null);
      setSyncMessage(null);
      const configuration = configurationFromStudioSettings(
        settings,
        selectedInstance.instance.configuration as ShowcaseConfiguration,
      );
      await updateShowcaseInstanceConfiguration(selectedInstance.instance.instanceId, configuration);
      await refresh();
      setSyncMessage("Instance studio settings saved. Theme editor and runtime sync will use the updated instance configuration.");
    } catch (saveError) {
      setSyncError(saveError instanceof Error ? saveError.message : "Unable to save showcase instance");
    } finally {
      setIsSavingSync(false);
    }
  }

  function openThemeEditor() {
    if (!selectedTheme) return;
    window.open(selectedTheme.editorUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <main style={shellStyles.page}>
      <div style={shellStyles.container}>
        <div style={{ ...shellStyles.card, padding: 18, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748B" }}>
                Vypari product showcase
              </div>
              <div style={{ marginTop: 6, fontSize: 28, lineHeight: 1.05, fontWeight: 800, letterSpacing: "-0.04em" }}>
                Shopify onboarding and showcase studio
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {installationSuccess ? <Pill tone="success">Installation complete</Pill> : null}
              <button
                type="button"
                onClick={() => setView("onboarding")}
                style={{
                  borderRadius: 999,
                  border: "1px solid rgba(17,24,39,0.1)",
                  padding: "10px 16px",
                  background: view === "onboarding" ? "#111827" : "#FFFFFF",
                  color: view === "onboarding" ? "#FFFFFF" : "#111827",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Onboarding
              </button>
              <button
                type="button"
                onClick={() => setView("studio")}
                style={{
                  borderRadius: 999,
                  border: "1px solid rgba(17,24,39,0.1)",
                  padding: "10px 16px",
                  background: view === "studio" ? "#111827" : "#FFFFFF",
                  color: view === "studio" ? "#FFFFFF" : "#111827",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Studio
              </button>
            </div>
          </div>
        </div>

        {view === "onboarding" ? (
          <div style={{ display: "grid", gap: 18 }}>
            <div style={{ ...shellStyles.card, padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>Choose a theme to onboard</div>
                  <div style={{ marginTop: 6, fontSize: 14, color: "#526071" }}>
                    Shopify app blocks are added from the theme editor’s Apps panel. We start by targeting the merchant’s live or development theme.
                  </div>
                </div>
                {isLoading ? <Pill>Loading themes...</Pill> : <Pill>{themes.length} themes found</Pill>}
              </div>
              {error ? (
                <div style={{ marginTop: 16, color: "#B91C1C", fontWeight: 600 }}>{error}</div>
              ) : (
                <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
                  {themes.map((theme) => (
                    <ThemeCard
                      key={theme.id}
                      theme={theme}
                      active={selectedThemeId === theme.id}
                      onSelect={() => setSelectedThemeId(theme.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            <OnboardingPanel
              selectedTheme={selectedTheme}
              selectedInstance={selectedInstance}
              instances={instances}
              onSelectInstance={setSelectedInstanceId}
              onOpenThemeEditor={openThemeEditor}
              bootstrapResult={bootstrapResult}
              isBootstrapping={isBootstrapping}
              onBootstrap={handleBootstrap}
              instancesLoading={instancesLoading}
            />

            <SyncPanel
              selectedInstance={selectedInstance}
              initialSettings={initialStudioSettings}
              onSave={handleSaveSync}
              isSaving={isSavingSync}
              saveMessage={syncMessage}
            />

            {bootstrapError ? (
              <div style={{ ...shellStyles.card, padding: 18, color: "#991B1B", fontWeight: 700 }}>{bootstrapError}</div>
            ) : null}
            {instancesError ? (
              <div style={{ ...shellStyles.card, padding: 18, color: "#991B1B", fontWeight: 700 }}>{instancesError}</div>
            ) : null}
            {syncError ? (
              <div style={{ ...shellStyles.card, padding: 18, color: "#991B1B", fontWeight: 700 }}>{syncError}</div>
            ) : null}
          </div>
        ) : (
          <ProductShowcaseStudio />
        )}
      </div>
    </main>
  );
}
