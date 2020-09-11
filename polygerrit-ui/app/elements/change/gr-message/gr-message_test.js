/**
 * @license
 * Copyright (C) 2016 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import '../../../test/common-test-setup-karma.js';
import './gr-message.js';

const basicFixture = fixtureFromElement('gr-message');

suite('gr-message tests', () => {
  let element;

  suite('when admin and logged in', () => {
    setup(done => {
      stub('gr-rest-api-interface', {
        getLoggedIn() { return Promise.resolve(true); },
        getPreferences() { return Promise.resolve({}); },
        getConfig() { return Promise.resolve({}); },
        getIsAdmin() { return Promise.resolve(true); },
        deleteChangeCommitMessage() { return Promise.resolve({}); },
      });
      element = basicFixture.instantiate();
      flush(done);
    });

    test('reply event', done => {
      element.message = {
        id: '47c43261_55aa2c41',
        author: {
          _account_id: 1115495,
          name: 'Andrew Bonventre',
          email: 'andybons@chromium.org',
        },
        date: '2016-01-12 20:24:49.448000000',
        message: 'Uploaded patch set 1.',
        _revision_number: 1,
        expanded: true,
      };

      element.addEventListener('reply', e => {
        assert.deepEqual(e.detail.message, element.message);
        done();
      });
      flushAsynchronousOperations();
      assert.isFalse(
          element.shadowRoot.querySelector('.replyActionContainer').hidden
      );
      MockInteractions.tap(element.shadowRoot.querySelector('.replyBtn'));
    });

    test('can see delete button', () => {
      element.message = {
        id: '47c43261_55aa2c41',
        author: {
          _account_id: 1115495,
          name: 'Andrew Bonventre',
          email: 'andybons@chromium.org',
        },
        date: '2016-01-12 20:24:49.448000000',
        message: 'Uploaded patch set 1.',
        _revision_number: 1,
        expanded: true,
      };

      flushAsynchronousOperations();
      assert.isFalse(element.shadowRoot.querySelector('.deleteBtn').hidden);
    });

    test('delete change message', done => {
      element.changeNum = 314159;
      element.message = {
        id: '47c43261_55aa2c41',
        author: {
          _account_id: 1115495,
          name: 'Andrew Bonventre',
          email: 'andybons@chromium.org',
        },
        date: '2016-01-12 20:24:49.448000000',
        message: 'Uploaded patch set 1.',
        _revision_number: 1,
        expanded: true,
      };

      element.addEventListener('change-message-deleted', e => {
        assert.deepEqual(e.detail.message, element.message);
        assert.isFalse(element.shadowRoot.querySelector('.deleteBtn').disabled);
        done();
      });
      flushAsynchronousOperations();
      MockInteractions.tap(element.shadowRoot.querySelector('.deleteBtn'));
      assert.isTrue(element.shadowRoot.querySelector('.deleteBtn').disabled);
    });

    test('autogenerated prefix hiding', () => {
      element.message = {
        tag: 'autogenerated:gerrit:test',
        updated: '2016-01-12 20:24:49.448000000',
        expanded: false,
      };

      assert.isTrue(element.isAutomated);
      assert.isFalse(element.hidden);

      element.hideAutomated = true;

      assert.isTrue(element.hidden);
    });

    test('reviewer message treated as autogenerated', () => {
      element.message = {
        tag: 'autogenerated:gerrit:test',
        updated: '2016-01-12 20:24:49.448000000',
        reviewer: {},
        expanded: false,
      };

      assert.isTrue(element.isAutomated);
      assert.isFalse(element.hidden);

      element.hideAutomated = true;

      assert.isTrue(element.hidden);
    });

    test('batch reviewer message treated as autogenerated', () => {
      element.message = {
        type: 'REVIEWER_UPDATE',
        updated: '2016-01-12 20:24:49.448000000',
        reviewer: {},
        expanded: false,
      };

      assert.isTrue(element.isAutomated);
      assert.isFalse(element.hidden);

      element.hideAutomated = true;

      assert.isTrue(element.hidden);
    });

    test('tag that is not autogenerated prefix does not hide', () => {
      element.message = {
        tag: 'something',
        updated: '2016-01-12 20:24:49.448000000',
        expanded: false,
      };

      assert.isFalse(element.isAutomated);
      assert.isFalse(element.hidden);

      element.hideAutomated = true;

      assert.isFalse(element.hidden);
    });

    test('reply button hidden unless logged in', () => {
      const message = {
        message: 'Uploaded patch set 1.',
        expanded: false,
      };
      assert.isFalse(element._computeShowReplyButton(message, false));
      assert.isTrue(element._computeShowReplyButton(message, true));
    });

    test('_computeShowOnBehalfOf', () => {
      const message = {
        message: '...',
        expanded: false,
      };
      assert.isNotOk(element._computeShowOnBehalfOf(message));
      message.author = {_account_id: 1115495};
      assert.isNotOk(element._computeShowOnBehalfOf(message));
      message.real_author = {_account_id: 1115495};
      assert.isNotOk(element._computeShowOnBehalfOf(message));
      message.real_author._account_id = 123456;
      assert.isOk(element._computeShowOnBehalfOf(message));
      message.updated_by = message.author;
      delete message.author;
      assert.isOk(element._computeShowOnBehalfOf(message));
      delete message.updated_by;
      assert.isNotOk(element._computeShowOnBehalfOf(message));
    });

    ['Trybot-Ready', 'Tryjob-Request', 'Commit-Queue'].forEach(label => {
      test(`${label} ignored for color voting`, () => {
        element.message = {
          author: {},
          expanded: false,
          message: `Patch Set 1: ${label}+1`,
        };
        assert.isNotOk(
            element.root.querySelector('.negativeVote'));
        assert.isNotOk(
            element.root.querySelector('.positiveVote'));
      });
    });

    test('clicking on date link fires event', () => {
      element.message = {
        type: 'REVIEWER_UPDATE',
        updated: '2016-01-12 20:24:49.448000000',
        reviewer: {},
        id: '47c43261_55aa2c41',
        expanded: false,
      };
      flushAsynchronousOperations();
      const stub = sinon.stub();
      element.addEventListener('message-anchor-tap', stub);
      const dateEl = element.shadowRoot
          .querySelector('.date');
      assert.ok(dateEl);
      MockInteractions.tap(dateEl);

      assert.isTrue(stub.called);
      assert.deepEqual(stub.lastCall.args[0].detail, {id: element.message.id});
    });

    suite('compute messages', () => {
      test('empty', () => {
        assert.equal(element._computeMessageContent('', '', true), '');
        assert.equal(element._computeMessageContent('', '', false), '');
      });

      test('new patchset', () => {
        const original = 'Uploaded patch set 1.';
        const tag = 'autogenerated:gerrit:newPatchSet';
        let actual = element._computeMessageContent(original, tag, true);
        assert.equal(actual, element._computeMessageContentCollapsed(
            original, tag, []));
        assert.equal(actual, original);
        actual = element._computeMessageContent(original, tag, false);
        assert.equal(actual, original);
      });

      test('new patchset rebased', () => {
        const original = 'Patch Set 27: Patch Set 26 was rebased';
        const tag = 'autogenerated:gerrit:newPatchSet';
        const expected = 'Patch Set 26 was rebased';
        let actual = element._computeMessageContent(original, tag, true);
        assert.equal(actual, expected);
        assert.equal(actual, element._computeMessageContentCollapsed(
            original, tag, []));
        actual = element._computeMessageContent(original, tag, false);
        assert.equal(actual, expected);
      });

      test('ready for review', () => {
        const original = 'Patch Set 1:\n\nThis change is ready for review.';
        const tag = undefined;
        const expected = 'This change is ready for review.';
        let actual = element._computeMessageContent(original, tag, true);
        assert.equal(actual, expected);
        assert.equal(actual, element._computeMessageContentCollapsed(
            original, tag, []));
        actual = element._computeMessageContent(original, tag, false);
        assert.equal(actual, expected);
      });

      test('vote', () => {
        const original = 'Patch Set 1: Code-Style+1';
        const tag = undefined;
        const expected = '';
        let actual = element._computeMessageContent(original, tag, true);
        assert.equal(actual, expected);
        actual = element._computeMessageContent(original, tag, false);
        assert.equal(actual, expected);
      });

      test('comments', () => {
        const original = 'Patch Set 1:\n\n(3 comments)';
        const tag = undefined;
        const expected = '';
        let actual = element._computeMessageContent(original, tag, true);
        assert.equal(actual, expected);
        actual = element._computeMessageContent(original, tag, false);
        assert.equal(actual, expected);
      });
    });

    test('votes', () => {
      element.message = {
        author: {},
        expanded: false,
        message: 'Patch Set 1: Verified+1 Code-Review-2 Trybot-Label3+1 Blub+1',
      };
      element.labelExtremes = {
        'Verified': {max: 1, min: -1},
        'Code-Review': {max: 2, min: -2},
        'Trybot-Label3': {max: 3, min: 0},
      };
      flushAsynchronousOperations();
      const scoreChips = element.root.querySelectorAll('.score');
      assert.equal(scoreChips.length, 3);

      assert.isTrue(scoreChips[0].classList.contains('positive'));
      assert.isTrue(scoreChips[0].classList.contains('max'));

      assert.isTrue(scoreChips[1].classList.contains('negative'));
      assert.isTrue(scoreChips[1].classList.contains('min'));

      assert.isTrue(scoreChips[2].classList.contains('positive'));
      assert.isFalse(scoreChips[2].classList.contains('min'));
    });

    test('removed votes', () => {
      element.message = {
        author: {},
        expanded: false,
        message: 'Patch Set 1: Verified+1 -Code-Review -Commit-Queue',
      };
      element.labelExtremes = {
        'Verified': {max: 1, min: -1},
        'Code-Review': {max: 2, min: -2},
        'Commit-Queue': {max: 3, min: 0},
      };
      flushAsynchronousOperations();
      const scoreChips = element.root.querySelectorAll('.score');
      assert.equal(scoreChips.length, 3);

      assert.isTrue(scoreChips[1].classList.contains('removed'));
      assert.isTrue(scoreChips[2].classList.contains('removed'));
    });

    test('false negative vote', () => {
      element.message = {
        author: {},
        expanded: false,
        message: 'Patch Set 1: Cherry Picked from branch stable-2.14.',
      };
      element.labelExtremes = {};
      const scoreChips = element.root.querySelectorAll('.score');
      assert.equal(scoreChips.length, 0);
    });
  });

  suite('when not logged in', () => {
    setup(done => {
      stub('gr-rest-api-interface', {
        getLoggedIn() { return Promise.resolve(false); },
        getPreferences() { return Promise.resolve({}); },
        getConfig() { return Promise.resolve({}); },
        getIsAdmin() { return Promise.resolve(false); },
        deleteChangeCommitMessage() { return Promise.resolve({}); },
      });
      element = basicFixture.instantiate();
      flush(done);
    });

    test('reply and delete button should be hidden', () => {
      element.message = {
        id: '47c43261_55aa2c41',
        author: {
          _account_id: 1115495,
          name: 'Andrew Bonventre',
          email: 'andybons@chromium.org',
        },
        date: '2016-01-12 20:24:49.448000000',
        message: 'Uploaded patch set 1.',
        _revision_number: 1,
        expanded: true,
      };

      flushAsynchronousOperations();
      assert.isTrue(
          element.shadowRoot.querySelector('.replyActionContainer').hidden
      );
      assert.isTrue(
          element.shadowRoot.querySelector('.deleteBtn').hidden
      );
    });
  });

  suite('patchset comment summary', () => {
    setup(() => {
      element = basicFixture.instantiate();
      element.message = {id: '6a07f64a82f96e7337ca5f7f84cfc73abf8ac2a3'};
    });

    test('single patchset comment posted', () => {
      const threads = [{
        comments: [{
          __path: '/PATCHSET_LEVEL',
          change_message_id: '6a07f64a82f96e7337ca5f7f84cfc73abf8ac2a3',
          patch_set: 1,
          id: 'e365b138_bed65caa',
          updated: '2020-05-15 13:35:56.000000000',
          message: 'testing the load',
          unresolved: false,
          path: '/PATCHSET_LEVEL',
          collapsed: false,
        }],
        patchNum: 1,
        path: '/PATCHSET_LEVEL',
        rootId: 'e365b138_bed65caa',
      }];
      assert.equal(element._computeMessageContentCollapsed(
          '', undefined, threads), 'testing the load');
      assert.equal(element._computeMessageContent('', undefined, false), '');
    });

    test('single patchset comment with reply', () => {
      const threads = [{
        comments: [{
          __path: '/PATCHSET_LEVEL',
          patch_set: 1,
          id: 'e365b138_bed65caa',
          updated: '2020-05-15 13:35:56.000000000',
          message: 'testing the load',
          unresolved: false,
          path: '/PATCHSET_LEVEL',
          collapsed: false,
        }, {
          __path: '/PATCHSET_LEVEL',
          change_message_id: '6a07f64a82f96e7337ca5f7f84cfc73abf8ac2a3',
          patch_set: 1,
          id: 'd6efcc85_4cbbb6f4',
          in_reply_to: 'e365b138_bed65caa',
          updated: '2020-05-15 16:55:28.000000000',
          message: 'n',
          unresolved: false,
          path: '/PATCHSET_LEVEL',
          __draft: true,
          collapsed: true,
        }],
        patchNum: 1,
        path: '/PATCHSET_LEVEL',
        rootId: 'e365b138_bed65caa',
      }];
      assert.equal(element._computeMessageContentCollapsed(
          '', undefined, threads), 'n');
      assert.equal(element._computeMessageContent('', undefined, false), '');
    });
  });

  suite('when logged in but not admin', () => {
    setup(done => {
      stub('gr-rest-api-interface', {
        getLoggedIn() { return Promise.resolve(true); },
        getConfig() { return Promise.resolve({}); },
        getIsAdmin() { return Promise.resolve(false); },
        deleteChangeCommitMessage() { return Promise.resolve({}); },
      });
      element = basicFixture.instantiate();
      flush(done);
    });

    test('can see reply but not delete button', () => {
      element.message = {
        id: '47c43261_55aa2c41',
        author: {
          _account_id: 1115495,
          name: 'Andrew Bonventre',
          email: 'andybons@chromium.org',
        },
        date: '2016-01-12 20:24:49.448000000',
        message: 'Uploaded patch set 1.',
        _revision_number: 1,
        expanded: true,
      };

      flushAsynchronousOperations();
      assert.isFalse(
          element.shadowRoot.querySelector('.replyActionContainer').hidden
      );
      assert.isTrue(
          element.shadowRoot.querySelector('.deleteBtn').hidden
      );
    });

    test('reply button shown when message is updated', () => {
      element.message = undefined;
      flushAsynchronousOperations();
      let replyEl = element.shadowRoot.querySelector('.replyActionContainer');
      // We don't even expect the button to show up in the DOM when the message
      // is undefined.
      assert.isNotOk(replyEl);

      element.message = {
        id: '47c43261_55aa2c41',
        author: {
          _account_id: 1115495,
          name: 'Andrew Bonventre',
          email: 'andybons@chromium.org',
        },
        date: '2016-01-12 20:24:49.448000000',
        message: 'not empty',
        _revision_number: 1,
        expanded: true,
      };
      flushAsynchronousOperations();
      replyEl = element.shadowRoot.querySelector('.replyActionContainer');
      assert.isOk(replyEl);
      assert.isFalse(replyEl.hidden);
    });
  });
});

