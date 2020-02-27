import { html } from "@polymer/polymer";
import { RiseElement } from "rise-common-component/src/rise-element.js";
import { version } from "./rise-embedded-template-version.js";

export default class RiseEmbeddedTemplate extends RiseElement {

  static get template() {
    return html`
      <iframe
        height="100%"
        width="100%"
        src="[[url]]"
        frameborder="0"
        allowTransparency="true"
        allowfullscreen="true"
        mozallowfullscreen="true"
        webkitallowfullscreen="true"
        sandbox="allow-forms allow-same-origin allow-scripts allow-presentation">
      </iframe>
    `;
  }

  static get properties() {
    return {
      templateId: {
        type: String
      },
      url: {
        type: String,
        readOnly: true,
        computed: "_computeUrl(templateId)"
      }
    }
  }

  constructor() {
    super();

    this._setVersion( version );
  }

  _computeUrl(templateId) {

    if (!templateId) {
      return "about:blank";
    }

    return `https://widgets.risevision.com/stable/templates/${templateId}/src/template.html`;
  }
}

customElements.define("rise-embedded-template", RiseEmbeddedTemplate);
