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
          align-items: center;
          justify-content: center;
          flex-direction: column;
          text-align: center;
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background-color: #F2F2F2;
        }
        #previewPlaceholder svg {
          height: 120px;
          width: 100%;
        }
        #previewPlaceholder h1 {
          color: #020620;
          font-size: 48px;
          text-transform: initial;
          font-family: Helvetica, Arial, sans-serif;
        }
      </style>
      <div id="previewPlaceholder">
        <svg viewBox="0 0 60 60" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          <g id="1.-Atoms" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
              <g id="Desktop/Icons" transform="translate(-423.000000, -1232.000000)" fill="#020620" fill-rule="nonzero">
                  <g id="icon-embedded-templates" transform="translate(423.000000, 1232.000000)">
                      <path d="M55,0 C57.6887547,0 59.8818181,2.12230671 59.9953805,4.78311038 L60,5 L60,55 C60,57.6887547 57.8776933,59.8818181 55.2168896,59.9953805 L55,60 L5,60 C2.3112453,60 0.118181885,57.8776933 0.00461951385,55.2168896 L0,55 L0,5 C0,2.3112453 2.12230671,0.118181885 4.78311038,0.00461951385 L5,0 L55,0 Z M53.75,32.5 L33.75,32.5 C33.0596441,32.5 32.5,33.0596441 32.5,33.75 L32.5,33.75 L32.5,53.75 C32.5,54.4403559 33.0596441,55 33.75,55 L33.75,55 L53.75,55 C54.4403559,55 55,54.4403559 55,53.75 L55,53.75 L55,33.75 C55,33.0596441 54.4403559,32.5 53.75,32.5 L53.75,32.5 Z" id="Shape"></path>
                  </g>
              </g>
          </g>
        </svg>
        <h1>Embedded Presentation</h1>
      </div>
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
      this.$.previewPlaceholder.style.display = "flex";
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
