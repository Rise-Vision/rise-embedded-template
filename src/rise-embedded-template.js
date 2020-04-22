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

  static get MAX_EMBED_LEVEL() {
    return 5;
  }

  constructor() {
    super();

    this._setVersion( version );
    this._templateIsReady = false;
    this._currentLevelOfEmbedding = this._getLevelOfEmbedding();
  }

  _computeUrl(templateId, presentationId) {

    if (!templateId) {
      return "about:blank";
    }

    if (this._currentLevelOfEmbedding >= RiseEmbeddedTemplate.MAX_EMBED_LEVEL) {
      return "data:text/html;charset=utf-8,<html><body>Maximum level of embedding is reached</body></html>";
    }

    const templateStage = this._getHostTemplatePath().startsWith("/staging") ? "staging" : "stable";

    const protocol = this._getHostTemplateProtocol();
    const type = RisePlayerConfiguration.Helpers.getHttpParameter("type");

    let url = `${protocol}//widgets.risevision.com/${templateStage}/templates/${templateId}/src/template.html`

    if (presentationId) {
      url = `${url}?presentationId=${presentationId}&type=${type}&frameElementId=template_${presentationId}`;
    }

    return url;
  }

  _getHostTemplateProtocol() {
    return window.location.protocol;
  }

  _getHostTemplatePath() {
    return window.location.pathname;
  }

  _getLevelOfEmbedding(currentWindow, currentLevel) {
    currentLevel = currentLevel || 0;
    currentWindow = currentWindow || window.self;

    if (window.top != currentWindow && currentWindow.parent && currentLevel < RiseEmbeddedTemplate.MAX_EMBED_LEVEL) {
      return this._getLevelOfEmbedding(currentWindow.parent, currentLevel + 1);
    } else {
      return currentLevel;
    }
  }

  ready() {
    super.ready();

    this.addEventListener("rise-playlist-play", () => this._play());
    this.addEventListener("rise-playlist-stop", () => this._stop());

    window.addEventListener("message", event => this._handleMessage(event), false);
  }

  _play() {
    if (this._templateIsReady) {
      this._sendMessageToTemplate({ topic: "rise-presentation-play" })
    }
  }

  _stop() {
    if (this._templateIsReady) {
      this._sendMessageToTemplate({ topic: "rise-presentation-stop" })
    }
  }

  _sendMessageToTemplate(message) {
    console.log(`${this.id} sending ${message.topic} to template`);
    this.$.template.contentWindow.postMessage(message, this.url);
  }

  _handleMessage(event) {
    if (event.source === this.$.template.contentWindow) {
      this._handleMessageFromTemplate(event);
    } else if (this.$.template.contentWindow && event.data && 
      (event.data.type === "attributeData" || event.data.type === "displayData")) {
      this.$.template.contentWindow.postMessage( event.data, this.url);  
    }
  }

  _handleMessageFromTemplate(event) {
    console.log(`${this.id} received ${event.data.topic} from template`);

    if (event.data.topic === "template-done") {
      super._sendDoneEvent(true);
    }

    if (event.data.topic === "rise-components-ready") {
      this._templateIsReady = true;
      this._sendEvent("rise-components-ready");
    }

    if (event.data.topic === "template-error") {
      this._sendEvent("rise-components-error");
    }
  }
}

customElements.define("rise-embedded-template", RiseEmbeddedTemplate);
