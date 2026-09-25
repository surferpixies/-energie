import Capacitor

class MyBridgeViewController: CAPBridgeViewController {
    static var pendingAuthURL: URL?

    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(HealthKitPlugin())
        bridge?.registerPluginInstance(AppleAuthPlugin())

        if let url = Self.pendingAuthURL {
            Self.pendingAuthURL = nil
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
                self.deliverAuthURL(url)
            }
        }
    }

    func handleAuthURL(_ url: URL) {
        guard bridge?.webView != nil else {
            Self.pendingAuthURL = url
            return
        }
        deliverAuthURL(url)
    }

    private func deliverAuthURL(_ url: URL) {
        guard let data = try? JSONSerialization.data(withJSONObject: url.absoluteString),
              let json = String(data: data, encoding: .utf8) else { return }
        let script = "window.EnergieHandleAuthURL && window.EnergieHandleAuthURL(\(json));"
        bridge?.webView?.evaluateJavaScript(script)
    }
}
