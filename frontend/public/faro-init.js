(function () {
  var CONSENT_KEY = 'venn_cookie_consent';
  function initFaro() {
    var webSdkScript = document.createElement('script');
    webSdkScript.src = 'https://unpkg.com/@grafana/faro-web-sdk@2.3.1/dist/bundle/faro-web-sdk.iife.js';
    webSdkScript.onload = function () {
      window.GrafanaFaroWebSdk.initializeFaro({
        url: 'https://faro-collector-prod-eu-west-2.grafana.net/collect/59c0454a0464bd381cca16caf30ba555',
        app: { name: 'VENN-OBS', version: '1.0.0', environment: 'production' },
        sessionTracking: { samplingRate: 1, persistent: true },
      });
      var tracingScript = document.createElement('script');
      tracingScript.src = 'https://unpkg.com/@grafana/faro-web-tracing@2.3.1/dist/bundle/faro-web-tracing.iife.js';
      tracingScript.onload = function () {
        window.GrafanaFaroWebSdk.faro.instrumentations.add(
          new window.GrafanaFaroWebTracing.TracingInstrumentation()
        );
      };
      document.head.appendChild(tracingScript);
    };
    document.head.appendChild(webSdkScript);
  }
  if (localStorage.getItem(CONSENT_KEY) === 'true') {
    initFaro();
  } else {
    window._vennFaroInit = initFaro;
  }
})();
