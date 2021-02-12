// Copyright (C) 2020 The Android Open Source Project
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package com.google.gerrit.server.restapi.change;

import static com.google.common.collect.MoreCollectors.onlyElement;
import static com.google.common.truth.Truth.assertThat;

import com.google.gerrit.entities.Change;
import com.google.gerrit.entities.ChangeMessage;
import com.google.gerrit.extensions.common.CommentInfo;
import com.google.gerrit.server.ChangeMessagesUtil;
import com.google.gerrit.server.CommentsUtil;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

@RunWith(JUnit4.class)
public class ListChangeCommentsTest {

  @Test
  public void commentsLinkedToChangeMessagesIgnoreGerritAutoGenTaggedMessages() {
    /* Comments should not be linked to Gerrit's autogenerated messages */
    List<CommentInfo> comments = createComments("c1", "00", "c2", "10", "c3", "25");
    List<ChangeMessage> changeMessages =
        createChangeMessages("cm1", "00", "cm2", "16", "cm3", "30");

    changeMessages.add(
        newChangeMessage("ignore", "cmAutoGenByGerrit", "15", ChangeMessagesUtil.TAG_MERGED));

    CommentsUtil.linkCommentsToChangeMessages(comments, changeMessages, true);

    assertThat(getComment(comments, "c1").changeMessageId)
        .isEqualTo(getChangeMessage(changeMessages, "cm1").getKey().uuid());
    /* comment 2 ignored the auto-generated message because it has a Gerrit tag */
    assertThat(getComment(comments, "c2").changeMessageId)
        .isEqualTo(getChangeMessage(changeMessages, "cm2").getKey().uuid());
    assertThat(getComment(comments, "c3").changeMessageId)
        .isEqualTo(getChangeMessage(changeMessages, "cm3").getKey().uuid());

    // Make sure no comment is linked to the auto-gen message
    Set<String> changeMessageIds =
        comments.stream().map(c -> c.changeMessageId).collect(Collectors.toSet());
    assertThat(changeMessageIds)
        .doesNotContain(getChangeMessage(changeMessages, "cmAutoGenByGerrit").getKey().uuid());
  }

  @Test
  public void commentsLinkedToChangeMessagesAllowLinkingToAutoGenTaggedMessages() {
    /* Human comments are allowed to be linked to autogenerated messages */
    List<CommentInfo> comments = createComments("c1", "00", "c2", "10", "c3", "25");
    List<ChangeMessage> changeMessages =
        createChangeMessages("cm1", "00", "cm2", "16", "cm3", "30");

    changeMessages.add(
        newChangeMessage(
            "cmAutoGen", "cmAutoGen", "15", ChangeMessagesUtil.AUTOGENERATED_TAG_PREFIX));

    CommentsUtil.linkCommentsToChangeMessages(comments, changeMessages, true);

    assertThat(getComment(comments, "c1").changeMessageId)
        .isEqualTo(getChangeMessage(changeMessages, "cm1").getKey().uuid());
    /* comment 2 did not ignore the auto-generated change message */
    assertThat(getComment(comments, "c2").changeMessageId)
        .isEqualTo(getChangeMessage(changeMessages, "cmAutoGen").getKey().uuid());
    assertThat(getComment(comments, "c3").changeMessageId)
        .isEqualTo(getChangeMessage(changeMessages, "cm3").getKey().uuid());
  }

  /**
   * Create a list of comments from the specified args args should be passed as consecutive pairs of
   * messages and timestamps example: (m1, t1, m2, t2, ...)
   */
  private static List<CommentInfo> createComments(String... args) {
    List<CommentInfo> comments = new ArrayList<>();
    for (int i = 0; i < args.length; i += 2) {
      String message = args[i];
      String ts = args[i + 1];
      comments.add(newCommentInfo(message, ts));
    }
    return comments;
  }

  /**
   * Create a list of change messages from the specified args args should be passed as consecutive
   * pairs of messages and timestamps example: (m1, t1, m2, t2, ...). the tag parameter for the
   * created change messages will be null.
   */
  private static List<ChangeMessage> createChangeMessages(String... args) {
    List<ChangeMessage> changeMessages = new ArrayList<>();
    for (int i = 0; i < args.length; i += 2) {
      String key = args[i] + "Key";
      String message = args[i];
      String ts = args[i + 1];
      changeMessages.add(newChangeMessage(key, message, ts, null));
    }
    return changeMessages;
  }

  /** Create a new CommentInfo with a given message and timestamp */
  private static CommentInfo newCommentInfo(String message, String ts) {
    CommentInfo c = new CommentInfo();
    c.message = message;
    c.updated = Timestamp.valueOf("2000-01-01 00:00:" + ts);
    return c;
  }

  /** Create a new change message with an id, message, timestamp and tag */
  private static ChangeMessage newChangeMessage(String id, String message, String ts, String tag) {
    ChangeMessage.Key key = ChangeMessage.key(Change.id(1), id);
    ChangeMessage cm =
        new ChangeMessage(key, null, Timestamp.valueOf("2000-01-01 00:00:" + ts), null);
    cm.setMessage(message);
    cm.setTag(tag);
    return cm;
  }

  /** Return the change message from the list of messages that has specific message text */
  private static ChangeMessage getChangeMessage(List<ChangeMessage> messages, String messageText) {
    return messages.stream().filter(m -> m.getMessage().equals(messageText)).collect(onlyElement());
  }

  /** Return the comment from the list of comments that has specific message text */
  private CommentInfo getComment(List<CommentInfo> comments, String messageText) {
    return comments.stream().filter(c -> c.message.equals(messageText)).collect(onlyElement());
  }
}
