import { html } from "@polymer/polymer";
import { RiseElement } from "rise-common-component/src/rise-element.js";
import { version } from "./rise-embedded-template-version.js";

export default class RiseEmbeddedTemplate extends RiseElement {

  static get template() {
    return html`
      <iframe
        id="template"
        height="100%"
        width="100%"
        src="[[url]]"
        frameborder="0"
        allowTransparency="true"
        allowfullscreen="true"
        mozallowfullscreen="true"
        webkitallowfullscreen="true">
      </iframe>
    `;
  }

  static get properties() {
    return {
      templateId: {
        type: String
      },
      presentationId: {
        type: String
      },
      url: {
        type: String,
        readOnly: true,
        computed: "_computeUrl(templateId, presentationId)"
      }
    }
  }

  constructor() {
    super();

    this._setVersion( version );
  }

  _computeUrl(templateId, presentationId) {

    if (!templateId) {
      return "about:blank";
    }

    const templateStage = this._getHostTemplatePath().startsWith("/staging") ? "staging" : "stable";

    let url = `https://widgets.risevision.com/${templateStage}/templates/${templateId}/src/template.html`

    if (presentationId) {
      url = `${url}?presentationId=${presentationId}`;
    }

    return url;
  }

  _getHostTemplatePath() {
    return window.location.pathname;
  }

  ready() {
    super.ready();

    this.addEventListener("rise-playlist-play", () => this._sendMessageToTemplate({ topic: "rise-presentation-play" }));
    this.addEventListener("rise-playlist-stop", () => this._sendMessageToTemplate({ topic: "rise-presentation-stop" }));

    window.addEventListener("message", event => this._handleMessageFromTemplate(event), false);
  }

  _sendMessageToTemplate(message) {
    this.$.template.contentWindow.postMessage(message, this.url);
  }

  _handleMessageFromTemplate(event) {
    if (event.source !== this.$.template.contentWindow) {
      return;
    }

    if (event.data.topic === "template-done") {
      super._sendDoneEvent(true);
    }
  }
}

customElements.define("rise-embedded-template", RiseEmbeddedTemplate);
