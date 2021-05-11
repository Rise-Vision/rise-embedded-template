import { html } from "@polymer/polymer";
import { RiseElement } from "rise-common-component/src/rise-element.js";
import { version } from "./rise-embedded-template-version.js";

export const DONE_PREVIEW_DELAY = 10 * 1000;

export default class RiseEmbeddedTemplate extends RiseElement {
  static get template() {
    return html`
      <style>
        #previewPlaceholder {
          display: none;
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          background-image: url("data:image/svg+xml;charset=utf-8;base64,PHN2ZyB2aWV3Qm94PSIwIDAgNjAgNjAiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICAgICAgICA8ZyBpZD0iMS4tQXRvbXMiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPgogICAgICAgICAgICAgIDxnIGlkPSJEZXNrdG9wL0ljb25zIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtNDIzLjAwMDAwMCwgLTEyMzIuMDAwMDAwKSIgZmlsbD0iIzAyMDYyMCIgZmlsbC1ydWxlPSJub256ZXJvIj4KICAgICAgICAgICAgICAgICAgPGcgaWQ9Imljb24tZW1iZWRkZWQtdGVtcGxhdGVzIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSg0MjMuMDAwMDAwLCAxMjMyLjAwMDAwMCkiPgogICAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTU1LDAgQzU3LjY4ODc1NDcsMCA1OS44ODE4MTgxLDIuMTIyMzA2NzEgNTkuOTk1MzgwNSw0Ljc4MzExMDM4IEw2MCw1IEw2MCw1NSBDNjAsNTcuNjg4NzU0NyA1Ny44Nzc2OTMzLDU5Ljg4MTgxODEgNTUuMjE2ODg5Niw1OS45OTUzODA1IEw1NSw2MCBMNSw2MCBDMi4zMTEyNDUzLDYwIDAuMTE4MTgxODg1LDU3Ljg3NzY5MzMgMC4wMDQ2MTk1MTM4NSw1NS4yMTY4ODk2IEwwLDU1IEwwLDUgQzAsMi4zMTEyNDUzIDIuMTIyMzA2NzEsMC4xMTgxODE4ODUgNC43ODMxMTAzOCwwLjAwNDYxOTUxMzg1IEw1LDAgTDU1LDAgWiBNNTMuNzUsMzIuNSBMMzMuNzUsMzIuNSBDMzMuMDU5NjQ0MSwzMi41IDMyLjUsMzMuMDU5NjQ0MSAzMi41LDMzLjc1IEwzMi41LDMzLjc1IEwzMi41LDUzLjc1IEMzMi41LDU0LjQ0MDM1NTkgMzMuMDU5NjQ0MSw1NSAzMy43NSw1NSBMMzMuNzUsNTUgTDUzLjc1LDU1IEM1NC40NDAzNTU5LDU1IDU1LDU0LjQ0MDM1NTkgNTUsNTMuNzUgTDU1LDUzLjc1IEw1NSwzMy43NSBDNTUsMzMuMDU5NjQ0MSA1NC40NDAzNTU5LDMyLjUgNTMuNzUsMzIuNSBMNTMuNzUsMzIuNSBaIiBpZD0iU2hhcGUiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgPC9nPgogICAgICAgICAgICAgIDwvZz4KICAgICAgICAgIDwvZz4KICAgICAgICA8L3N2Zz4=");
          background-position: center;
          background-repeat: no-repeat;
          background-size: auto 80px;
          background-color: #F2F2F2;
        }
      </style>
      <div id="previewPlaceholder"></div>
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

    if (this._isPreview) {
      this.$.previewPlaceholder.style.display = "block";
      return "about:blank";
    }

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

  get _isPreview() {
    // account for the component running in editor preview OR running locally in browser
    return RisePlayerConfiguration.Helpers.isEditorPreview() || !RisePlayerConfiguration.Helpers.isInViewer();
  }

  _startDonePreviewTimer() {
    if (this._donePreviewTimer) {
      clearTimeout(this._donePreviewTimer);
    }
    this._donePreviewTimer = setTimeout( () => super._sendDoneEvent(true), DONE_PREVIEW_DELAY );
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

    window.addEventListener("message", event => this._handleMessage(event), false);
  }

  _handleStart(event) {
    if (this._isPreview) {
      super._handleStart( event );
      return;
    }
    super._handleStart( event, true );
  }

  _handleRisePresentationPlay() {
    super._handleRisePresentationPlay();

    if (this._isPreview) {
      this._startDonePreviewTimer();
      return;
    }

    if (this._templateIsReady) {
      this._sendMessageToTemplate({ topic: "rise-presentation-play" })
    }
  }

  _handleRisePresentationStop() {
    super._handleRisePresentationStop();

    if (this._templateIsReady) {
      this._sendMessageToTemplate({ topic: "rise-presentation-stop" })
    }
  }

  _sendMessageToTemplate(message) {
    console.log(`${this.id} sending ${message.topic || message.type} to template`);
    this.$.template.contentWindow.postMessage(message, this.url);
  }

  _handleMessage(event) {
    if (event.source === this.$.template.contentWindow) {
      this._handleMessageFromTemplate(event);
    } else if (this.$.template.contentWindow && event.data && 
      (event.data.type === "attributeData" || event.data.type === "displayData" || event.data.type === "sendStartEvent")) {
      this._sendMessageToTemplate( event.data );
    }
  }

  _handleMessageFromTemplate(event) {
    console.log(`${this.id} received ${event.data.topic} from template`);

    if (event.data.topic === "template-done") {
      super._sendDoneEvent(true);
    }

    if (event.data.topic === "rise-components-ready") {
      this._templateIsReady = true;
      super._sendReadyEvent();
    }

    if (event.data.topic === "template-error") {
      this._sendEvent("rise-components-error");
    }
  }
}

customElements.define("rise-embedded-template", RiseEmbeddedTemplate);
