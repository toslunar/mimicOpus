import actionTypes from './actionTypes';
import Question from '../data/question';
import User from '../data/user';

export function openSignInDialog() {
  return {
    type: actionTypes.OPEN_SIGN_IN_DIALOG,
  };
}

export function closeSignInDialog() {
  return {
    type: actionTypes.CLOSE_SIGN_IN_DIALOG,
  };
}

export function openLicenseDialog() {
  return {
    type: actionTypes.OPEN_LICENSE_DIALOG,
  };
}

export function closeLicenseDialog() {
  return {
    type: actionTypes.CLOSE_LICENSE_DIALOG,
  };
}

export function openFAQDialog() {
  return {
    type: actionTypes.OPEN_FAQ_DIALOG,
  };
}

export function closeFAQDialog() {
  return {
    type: actionTypes.CLOSE_FAQ_DIALOG,
  };
}

export function changeDisplayMode(mode) {
  return {
    type: actionTypes.CHANGE_DISPLAY_MODE,
    mode,
  };
}

export function clearNotes() {
  return {
    type: actionTypes.CLEAR_NOTES,
  };
}

export function addNote(note) {
  return {
    type: actionTypes.ADD_NOTE,
    note,
  };
}

export function delNote(idx) {
  return {
    type: actionTypes.DEL_NOTE,
    idx,
  };
}

export function setNotes(notes) {
  return {
    type: actionTypes.SET_NOTES,
    notes,
  };
}

export function shiftPitchRange(delta) {
  return {
    type: actionTypes.SHIFT_PITCH_RANGE,
    delta,
  };
}

export function setQuestion(question) {
  return {
    type: actionTypes.SET_QUESTION,
    question,
  };
}

export function setBPM(bpm) {
  return {
    type: actionTypes.SET_BPM,
    bpm,
  };
}

export function setTitle(title) {
  return {
    type: actionTypes.SET_TITLE,
    title,
  };
}

export function setQuestionId(questionId) {
  return {
    type: actionTypes.SET_QUESTION_ID,
    questionId,
  };
}

export function addQuestionToList(id, question) {
  return {
    type: actionTypes.ADD_QUESTION_TO_LIST,
    id,
    question,
  };
}

export function clearQuestionsList() {
  return {
    type: actionTypes.CLEAR_QUESTIONS_LIST,
  };
}

export function changeUploadedQuestion(questionId, question) {
  const obj = question.toJS();
  obj.id = questionId;
  const method = 'POST';
  const body = JSON.stringify(obj);
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  fetch('./api/changeQuestion', { method, headers, body })
    .then(res => res.json())
    .catch(console.error);
}

export function deleteUploadedQuestion(questionId, callback) {
  const method = 'POST';
  const body = JSON.stringify({ id: questionId });
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  fetch('./api/deleteQuestion', { method, headers, body })
    .then((res) => {
      callback();
      return res.json();
    })
    .catch(console.error);
}

export function uploadQuestion(question) {
  const obj = question.toJS();
  const method = 'POST';
  const body = JSON.stringify(obj);
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  fetch('./api/uploadQuestion', { method, headers, body })
    .then(res => res.json())
    .catch(console.error);
}

export function loadQuestionsList(
  dispatch, lowBPM = 0, highBPM = 1000, start = 1, stop = 10, title = '', user = '',
  madeByMe = true, answered = true, unanswered = true,
) {
  dispatch(clearQuestionsList());

  const method = 'GET';
  const params = new URLSearchParams();
  params.set('lowBPM', lowBPM);
  params.set('highBPM', highBPM);
  params.set('start', start);
  params.set('stop', stop);
  params.set('title', title);
  params.set('user', user);
  params.set('madeByMe', madeByMe);
  params.set('answered', answered);
  params.set('unanswered', unanswered);
  fetch(`./api/loadQuestionsList?${params.toString()}`, { method })
    .then(res => res.json())
    .then((results) => {
      results.forEach((item) => {
        dispatch(addQuestionToList(item.id, Question.fromJS(item.question)));
      });
    })
    .catch(console.error);
}

export function addQuestionToNewList(id, question) {
  return {
    type: actionTypes.ADD_QUESTION_TO_NEW_LIST,
    id,
    question,
  };
}

export function clearNewQuestionsList() {
  return {
    type: actionTypes.CLEAR_NEW_QUESTIONS_LIST,
  };
}

export function loadNewQuestionsList(dispatch) {
  dispatch(clearNewQuestionsList());
  const method = 'GET';
  const params = new URLSearchParams();
  params.set('start', 1);
  params.set('stop', 4);
  params.set('madeByMe', false);
  fetch(`./api/loadQuestionsList?${params.toString()}`, { method })
    .then(res => res.json())
    .then((results) => {
      results.forEach((item) => {
        dispatch(addQuestionToNewList(item.id, Question.fromJS(item.question)));
      });
    })
    .catch(console.error);
}

export function saveAnswer(qid, notes, score) {
  const method = 'POST';
  const body = JSON.stringify({ qid, notes, score });
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  fetch('./api/saveAnswer', { method, headers, body })
    .then(res => res.json())
    .catch(console.error);
}

export function setDisplayName(displayName) {
  return {
    type: actionTypes.SET_DISPLAY_NAME,
    displayName,
  };
}

export function setPhotoURL(photoURL) {
  return {
    type: actionTypes.SET_PHOTO_URL,
    photoURL,
  };
}

export function setUid(uid) {
  return {
    type: actionTypes.SET_UID,
    uid,
  };
}

export function setProvider(provider) {
  return {
    type: actionTypes.SET_PROVIDER,
    provider,
  };
}

export function loadMe(dispatch) {
  fetch('./api/getMe', { method: 'GET' })
    .then(res => res.json())
    .then((results) => {
      if (results.id !== -1) {
        dispatch(setDisplayName(results.displayName));
        dispatch(setPhotoURL(results.photoURL));
        dispatch(setUid(results.id));
        dispatch(setProvider(results.provider));
      } else {
        dispatch(setDisplayName('anonymous'));
        dispatch(setPhotoURL(''));
        dispatch(setUid(-1));
        dispatch(setProvider('anonymous'));
      }
    });
}

export function changeDisplayName(dispatch, name) {
  const method = 'POST';
  const body = JSON.stringify({ name });
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  fetch('./api/changeDisplayName', { method, headers, body })
    .then(res => res.json())
    .then(() => {
      loadMe(dispatch);
    })
    .catch(console.error);
}

export function setLowBPM(bpm) {
  return {
    type: actionTypes.SET_LOW_BPM,
    bpm,
  };
}

export function setHighBPM(bpm) {
  return {
    type: actionTypes.SET_HIGH_BPM,
    bpm,
  };
}

export function setSearchTitle(searchTitle) {
  return {
    type: actionTypes.SET_SEARCH_TITLE,
    searchTitle,
  };
}

export function setSearchUser(searchUser) {
  return {
    type: actionTypes.SET_SEARCH_USER,
    searchUser,
  };
}

export function setCountQuestions(count) {
  return {
    type: actionTypes.SET_COUNT_QUESTIONS,
    count,
  };
}

export function loadCountQuestions(
  dispatch, lowBPM = 0, highBPM = 1000, title = '', user = '', madeByMe = true, answered = true, unanswered = true
) {
  const method = 'GET';
  const params = new URLSearchParams();
  params.set('lowBPM', lowBPM);
  params.set('highBPM', highBPM);
  params.set('title', title);
  params.set('user', user);
  params.set('madeByMe', madeByMe);
  params.set('answered', answered);
  params.set('unanswered', unanswered);
  fetch(`./api/countQuestions?${params.toString()}`, { method })
    .then(res => res.json())
    .then((results) => {
      dispatch(setCountQuestions(results.count));
    })
    .catch(console.error);
}

export function addRankedUser(rank, user) {
  return {
    type: actionTypes.ADD_RANKED_USER,
    rank,
    user,
  };
}

export function clearRankingUsers() {
  return {
    type: actionTypes.CLEAR_RANKING_USERS,
  };
}

export function loadRanking(dispatch, start = 1, stop = 10) {
  dispatch(clearRankingUsers());

  const method = 'GET';
  const params = new URLSearchParams();
  params.set('start', start);
  params.set('stop', stop);
  fetch(`./api/getRanking?${params.toString()}`, { method })
    .then(res => res.json())
    .then((results) => {
      results.ranking.forEach((item, idx) => {
        dispatch(addRankedUser(start + idx, new User(item)));
      });
    })
    .catch(console.error);
}

export function addQuestionToOsusumeList(id, question) {
  return {
    type: actionTypes.ADD_QUESTION_TO_OSUSUME_LIST,
    id,
    question,
  };
}

export function clearOsusumeQuestionsList() {
  return {
    type: actionTypes.CLEAR_OSUSUME_QUESTIONS_LIST,
  };
}

export function loadOsusumeQuestionsList(dispatch) {
  dispatch(clearOsusumeQuestionsList());
  const method = 'GET';
  const params = new URLSearchParams();
  params.set('start', 1);
  params.set('stop', 4);
  params.set('orderMode', 'osusume');
  params.set('madeByMe', false);
  params.set('answered', false);
  fetch(`./api/loadQuestionsList?${params.toString()}`, { method })
    .then(res => res.json())
    .then((results) => {
      results.forEach((item) => {
        dispatch(addQuestionToOsusumeList(item.id, Question.fromJS(item.question)));
      });
    })
    .catch(console.error);
}
