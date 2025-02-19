/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {Subscription} from 'rxjs';
import '@polymer/iron-a11y-announcer/iron-a11y-announcer';
import '../../../elements/shared/gr-button/gr-button';
import '../../../elements/shared/gr-icon/gr-icon';
import {DiffViewMode} from '../../../constants/constants';
import {customElement, property, state} from 'lit/decorators.js';
import {IronA11yAnnouncer} from '@polymer/iron-a11y-announcer/iron-a11y-announcer';
import {FixIronA11yAnnouncer} from '../../../types/types';
import {fireIronAnnounce} from '../../../utils/event-util';
import {browserModelToken} from '../../../models/browser/browser-model';
import {resolve} from '../../../models/dependency';
import {css, html, LitElement} from 'lit';
import {sharedStyles} from '../../../styles/shared-styles';
import {userModelToken} from '../../../models/user/user-model';

@customElement('gr-diff-mode-selector')
export class GrDiffModeSelector extends LitElement {
  /**
   * If set to true, the user's preference will be updated every time a
   * button is tapped. Don't set to true if there is no user.
   */
  @property({type: Boolean}) saveOnChange = false;

  @property({type: Boolean, attribute: 'show-tooltip-below'})
  showTooltipBelow = false;

  // visible for testing
  @state() mode: DiffViewMode = DiffViewMode.SIDE_BY_SIDE;

  private readonly getBrowserModel = resolve(this, browserModelToken);

  private readonly getUserModel = resolve(this, userModelToken);

  private subscriptions: Subscription[] = [];

  constructor() {
    super();
  }

  override connectedCallback() {
    super.connectedCallback();
    (
      IronA11yAnnouncer as unknown as FixIronA11yAnnouncer
    ).requestAvailability();
    this.subscriptions.push(
      this.getBrowserModel().diffViewMode$.subscribe(
        diffView => (this.mode = diffView)
      )
    );
  }

  override disconnectedCallback() {
    for (const s of this.subscriptions) {
      s.unsubscribe();
    }
    this.subscriptions = [];
    super.disconnectedCallback();
  }

  static override styles = [
    sharedStyles,
    css`
      :host {
        /* Used to remove horizontal whitespace between the icons. */
        display: flex;
      }
      gr-button.selected gr-icon {
        color: var(--link-color);
      }
      gr-icon {
        font-size: 1.3rem;
      }
    `,
  ];

  override render() {
    return html`
      <gr-tooltip-content
        has-tooltip
        title="Side-by-side diff"
        ?position-below=${this.showTooltipBelow}
      >
        <gr-button
          id="sideBySideBtn"
          link
          class=${this.computeSideBySideSelected()}
          aria-pressed=${this.isSideBySideSelected()}
          @click=${this.handleSideBySideTap}
        >
          <gr-icon icon="view_column_2" filled></gr-icon>
        </gr-button>
      </gr-tooltip-content>
      <gr-tooltip-content
        has-tooltip
        ?position-below=${this.showTooltipBelow}
        title="Unified diff"
      >
        <gr-button
          id="unifiedBtn"
          link
          class=${this.computeUnifiedSelected()}
          aria-pressed=${this.isUnifiedSelected()}
          @click=${this.handleUnifiedTap}
        >
          <gr-icon icon="calendar_view_day" filled></gr-icon>
        </gr-button>
      </gr-tooltip-content>
    `;
  }

  /**
   * Set the mode. If save on change is enabled also update the preference.
   */
  private setMode(newMode: DiffViewMode) {
    if (this.saveOnChange && this.mode && this.mode !== newMode) {
      this.getUserModel().updatePreferences({diff_view: newMode});
    }
    this.mode = newMode;
    let announcement;
    if (this.isUnifiedSelected()) {
      announcement = 'Changed diff view to unified';
    } else if (this.isSideBySideSelected()) {
      announcement = 'Changed diff view to side by side';
    }
    if (announcement) {
      fireIronAnnounce(this, announcement);
    }
  }

  private computeSideBySideSelected() {
    return this.mode === DiffViewMode.SIDE_BY_SIDE ? 'selected' : '';
  }

  private computeUnifiedSelected() {
    return this.mode === DiffViewMode.UNIFIED ? 'selected' : '';
  }

  private isSideBySideSelected() {
    return this.mode === DiffViewMode.SIDE_BY_SIDE;
  }

  private isUnifiedSelected() {
    return this.mode === DiffViewMode.UNIFIED;
  }

  private handleSideBySideTap() {
    this.setMode(DiffViewMode.SIDE_BY_SIDE);
  }

  private handleUnifiedTap() {
    this.setMode(DiffViewMode.UNIFIED);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gr-diff-mode-selector': GrDiffModeSelector;
  }
}
