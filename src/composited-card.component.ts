import { LitElement, html, customElement, property } from 'lit-element';
import ResizeObserver from '@juggle/resize-observer';

import {
  loadingTemplate,
  mythicImageLayersTemplate,
  nonMythicImageLayersTemplate,
  baseArtworkLayersTemplate,
  textLayersTemplate,
} from './templating';

import './assets/fonts.css';
import { getStyles } from './styles';
import { type } from 'os';

export interface IResolutionSettings {
  lowDpi: number;
  highDpi: number;
}

export interface ICardProtoData {
  type: string;
  effect: string;
  name: string;
  rarity: string;
  god: string;
  set: string;
  tribe: string;
  mana: string;
  id: string;
  attack: number;
  health: number;
  art_id: string;
}

// @TODO: these should really come from an endpoint call,
// so that we can easily update them in the future...
export const legacyQualities = [
  'plain',
  // @NOTE: there may be "0" quality items in future, for now, these items
  // can use the plain layer imagery assets
  'plain',
  'bronze',
  'iron',
  'meteorite',
  'shadow',
  'gold',
  'diamond',
];

export const qualities = ['diamond', 'gold', 'shadow', 'meteorite', 'plain'];

// Deploy a native ResizeOberver for this component instance:
const ro = new ResizeObserver((entries) => {
  entries.forEach((entry) => {
    const el = entry.target as CompositedCard;
    el.handleResize(entry);
  });
});

/**
 *
 * GU Composited Card Web Component
 * -----------------------------------------------------------------
 *
 * A simple, framework agnostic web component to facilitate the
 * display of Gods Unchained card element(s).
 *
 * @customElement
 * @demo https://immutable.github.io/gu-composited-card/
 *
 * @input protoId
 * @input quality
 * @input inputProtoData
 * @input responsiveSrcsetSizes
 * @input useLegacyQualityMapping
 *
 * @author Tim Paul <tim.paul@immutable.com> <@glomotion>
 *
 */
@customElement('composited-card')
export class CompositedCard extends LitElement {
  @property({ type: Number }) protoId: number;
  @property({ type: Number }) quality: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 = 5;
  @property({ type: Object }) inputProtoData: ICardProtoData;
  @property({ type: String }) responsiveSrcsetSizes: string;
  @property({ type: Boolean }) useLegacyQualityMapping = false;

  protoCardData: ICardProtoData = {
    type: '',
    effect: '',
    name: '',
    rarity: '',
    god: '',
    set: '',
    mana: '',
    id: '',
    attack: null,
    health: null,
    tribe: '',
    art_id: '',
  };
  ch: number;
  cw: number;
  loading: boolean;

  static get styles() {
    return getStyles();
  }

  constructor() {
    super();
    this.loading = true;
    this.quality = 0;
    this.ch = this.offsetHeight * 0.01;
    this.cw = this.offsetWidth * 0.01;
  }

  /**
   * Generic LitElement component life-cycle events
   */
  connectedCallback() {
    super.connectedCallback();
    ro.observe(this);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    ro.unobserve(this);
  }
  updated(changedProps: any) {
    changedProps.forEach((oldValue, propName) => {
      if (propName === 'protoId') {
        this.getProtoDataFromApi();
      } else if (propName === 'inputProtoData') {
        this.getProtoDataFromInput();
      }
    });
  }

  /**
   * Generic resize handling
   */
  public handleResize(event: UIEvent) {
    const container = (event.target as HTMLElement).shadowRoot.children[0] as HTMLElement;
    this.ch = container.offsetHeight * 0.01;
    this.cw = container.offsetWidth * 0.01;
    this.requestUpdate();
  }

  /**
   * A method to fetch a protoId's card info data
   */
  private async fetchProtoData() {
    this.loading = true;
    return fetch(
      `https://api.godsunchained.com/v0/proto/${this.protoId}`,
    ).then((resp) => resp.json());
  }

  /**
   * A method to handle the fetching, and then processing
   * of proto card data
   */
  private async getProtoDataFromApi() {
    console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');
    return this.fetchProtoData().then((data) => {
      const {
        id,
        type,
        attack,
        health,
        effect,
        name,
        rarity,
        god,
        mana,
        set,
        tribe,
        art_id,
      } = data;
      this.protoCardData = {
        id,
        type,
        attack: attack.Int64,
        health: health.Int64,
        effect,
        name,
        rarity,
        god,
        mana,
        set,
        tribe: tribe.String,
        art_id,
      };
      this.loading = false;
      this.requestUpdate();
      return data;
    });
  }

  /**
   * A method for Injesting of proto card data that is manually
   * input into the component
   */
  private getProtoDataFromInput() {
    this.protoCardData = { ...this.inputProtoData };
    this.loading = false;
    this.requestUpdate();
  }

  /**
   * A `render` method to define the DOM structure of the component
   */
  render() {
    const qualityName = this.useLegacyQualityMapping
      ? legacyQualities[this.quality]
      : qualities[this.quality - 1];
    const isMythicCard = this.protoCardData.rarity === 'mythic';
    return html`
      <div class="card__innerRatioConstrainer">
        ${this.loading
          ? loadingTemplate()
          : html`
              ${baseArtworkLayersTemplate({
                id: this.protoCardData.id,
                responsiveSrcsetSizes: this.responsiveSrcsetSizes,
              })}
              ${isMythicCard
                ? mythicImageLayersTemplate({
                    responsiveSrcsetSizes: this.responsiveSrcsetSizes,
                    ...this.protoCardData,
                  })
                : nonMythicImageLayersTemplate({
                    qualityName: qualityName,
                    responsiveSrcsetSizes: this.responsiveSrcsetSizes,
                    ...this.protoCardData,
                  })}
              ${textLayersTemplate({
                ch: this.ch,
                cw: this.cw,
                ...this.protoCardData,
                cardSet: this.protoCardData.set,
              })}
            `}
      </div>
    `;
  }
}
