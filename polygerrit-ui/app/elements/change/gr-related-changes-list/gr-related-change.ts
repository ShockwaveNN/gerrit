/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {LitElement, css, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {sharedStyles} from '../../../styles/shared-styles';
import {
  ChangeInfo,
  RelatedChangeAndCommitInfo,
  CommitId,
} from '../../../types/common';
import {ChangeStatus} from '../../../constants/constants';
import {isChangeInfo} from '../../../utils/change-util';
import {ifDefined} from 'lit/directives/if-defined.js';
import {classMap} from 'lit/directives/class-map.js';

@customElement('gr-related-change')
export class GrRelatedChange extends LitElement {
  @property({type: Object})
  change?: ChangeInfo | RelatedChangeAndCommitInfo;

  @property()
  href?: string;

  @property()
  label?: string;

  @property({type: Boolean, attribute: 'show-submittable-check'})
  showSubmittableCheck = false;

  @property({type: Boolean, attribute: 'show-change-status'})
  showChangeStatus = false;

  /*
   * Needed for calculation if change is direct or indirect ancestor/descendant
   * to current change.
   */
  @property({type: Array})
  connectedRevisions?: CommitId[];

  static override get styles() {
    return [
      sharedStyles,
      css`
        a {
          display: block;
        }
        :host,
        .changeContainer,
        a {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .changeContainer {
          display: flex;
        }
        .strikethrough {
          color: var(--deemphasized-text-color);
          text-decoration: line-through;
        }
        .status {
          color: var(--deemphasized-text-color);
          font-weight: var(--font-weight-bold);
          margin-left: var(--spacing-xs);
        }
        .notCurrent {
          color: var(--warning-foreground);
        }
        .indirectAncestor {
          color: var(--indirect-ancestor-text-color);
        }
        .submittableCheck {
          padding-left: var(--spacing-s);
          color: var(--positive-green-text-color);
          display: none;
        }
        .submittableCheck.submittable {
          display: inline;
        }
        .hidden,
        .mobile {
          display: none;
        }
        .submittableCheck {
          padding-left: var(--spacing-s);
          color: var(--positive-green-text-color);
          display: none;
        }
        .submittableCheck.submittable {
          display: inline;
        }
      `,
    ];
  }

  override render() {
    const change = this.change;
    if (!change) throw new Error('Missing change');
    const linkClass = {
      strikethrough: change.status === ChangeStatus.ABANDONED,
      submittable: !!change.submittable,
    };
    let statusClass = {};
    if (!isChangeInfo(change)) {
      statusClass = {
        status: true,
        notCurrent: change._revision_number !== change._current_revision_number,
        indirectAncestor: !!this.isIndirectAncestor(change),
        submittable: !!change.submittable,
        hidden: change.status === ChangeStatus.NEW,
      };
    }
    return html`
      <div class="changeContainer">
        <a
          href=${ifDefined(this.href)}
          aria-label=${ifDefined(this.label)}
          class=${classMap(linkClass)}
          ><slot></slot
        ></a>
        ${this.showSubmittableCheck
          ? html`<span
              tabindex="-1"
              title="Submittable"
              class="submittableCheck ${classMap(linkClass)}"
              role="img"
              aria-label="Submittable"
              >✓</span
            >`
          : ''}
        ${this.showChangeStatus && !isChangeInfo(change)
          ? html`<span class=${classMap(statusClass)}>
              (${this.computeChangeStatus(change)})
            </span>`
          : ''}
      </div>
    `;
  }

  private computeChangeStatus(change: RelatedChangeAndCommitInfo) {
    switch (change.status) {
      case ChangeStatus.MERGED:
        return 'Merged';
      case ChangeStatus.ABANDONED:
        return 'Abandoned';
    }
    if (change._revision_number !== change._current_revision_number) {
      return 'Not current';
    } else if (this.isIndirectAncestor(change)) {
      return 'Indirect ancestor';
    } else if (change.submittable) {
      return 'Submittable';
    }
    return '';
  }

  private isIndirectAncestor(change: RelatedChangeAndCommitInfo) {
    return (
      this.connectedRevisions &&
      !this.connectedRevisions.includes(change.commit.commit)
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gr-related-change': GrRelatedChange;
  }
}
