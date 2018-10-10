import { next } from '@ember/runloop';
import { typeOf } from '@ember/utils';
import Service, { inject as service } from '@ember/service';
import { Machine } from 'xstate';

import getStorage from 'vault/lib/token-storage';
import { STORAGE_KEYS, DEFAULTS, MACHINES } from 'vault/helpers/wizard-constants';
const TutorialMachine = Machine(MACHINES.tutorial);
let FeatureMachine = null;

export default Service.extend(DEFAULTS, {
  router: service(),
  showWhenUnauthenticated: false,
  featureMachineHistory: null,
  init() {
    this._super(...arguments);
    this.initializeMachines();
  },

  initializeMachines() {
    if (!this.storageHasKey(STORAGE_KEYS.TUTORIAL_STATE)) {
      let state = TutorialMachine.initialState;
      this.saveState('currentState', state.value);
      this.saveExtState(STORAGE_KEYS.TUTORIAL_STATE, state.value);
    }
    this.saveState('currentState', this.getExtState(STORAGE_KEYS.TUTORIAL_STATE));
    if (this.storageHasKey(STORAGE_KEYS.COMPONENT_STATE)) {
      this.set('componentState', this.getExtState(STORAGE_KEYS.COMPONENT_STATE));
    }
    let stateNodes = TutorialMachine.getStateNodes(this.currentState);
    this.executeActions(stateNodes.reduce((acc, node) => acc.concat(node.onEntry), []), null, 'tutorial');
    if (this.storageHasKey(STORAGE_KEYS.FEATURE_LIST)) {
      this.set('featureList', this.getExtState(STORAGE_KEYS.FEATURE_LIST));
      if (this.storageHasKey(STORAGE_KEYS.FEATURE_STATE)) {
        if (this.storageHasKey(STORAGE_KEYS.FEATURE_STATE_HISTORY)) {
          this.set('featureMachineHistory', this.getExtState(STORAGE_KEYS.FEATURE_STATE_HISTORY));
        }
        this.saveState('featureState', this.getExtState(STORAGE_KEYS.FEATURE_STATE));
      } else {
        if (FeatureMachine != null) {
          this.saveState('featureState', FeatureMachine.initialState);
          this.saveExtState(STORAGE_KEYS.FEATURE_STATE, this.featureState);
        }
      }
      this.buildFeatureMachine();
    }
  },

  restartGuide() {
    let storage = this.storage();
    // empty storage
    [
      STORAGE_KEYS.TUTORIAL_STATE,
      STORAGE_KEYS.FEATURE_LIST,
      STORAGE_KEYS.FEATURE_STATE,
      STORAGE_KEYS.FEATURE_STATE_HISTORY,
      STORAGE_KEYS.COMPLETED_FEATURES,
      STORAGE_KEYS.COMPONENT_STATE,
      STORAGE_KEYS.RESUME_URL,
      STORAGE_KEYS.RESUME_ROUTE,
    ].forEach(key => storage.removeItem(key));
    // reset wizard state
    this.setProperties(DEFAULTS);
    // restart machines from blank state
    this.initializeMachines();
    // progress machine to 'active.select'
    this.transitionTutorialMachine('idle', 'AUTH');
  },

  saveState(stateType, state) {
    if (state.value) {
      state = state.value;
    }
    let stateKey = '';
    while (typeOf(state) === 'object') {
      let newState = Object.keys(state);
      stateKey += newState + '.';
      state = state[newState];
    }
    stateKey += state;
    this.set(stateType, stateKey);
    if (stateType === 'featureState') {
      //TODO: what if they are in the middle of the tutorial when they start tracking progress?
      if (state === 'idle' || (state === 'wrap' && this.featureMachineHistory === null)) {
        let newHistory = [state];
        this.set('featureMachineHistory', newHistory);
      } else {
        if (this.featureMachineHistory) {
          if (!this.featureMachineHistory.includes(state)) {
            let newHistory = this.featureMachineHistory.addObject(state);
            this.set('featureMachineHistory', newHistory);
          } else {
            //we're repeating steps
            let stepIndex = this.featureMachineHistory.indexOf(state);
            let newHistory = this.featureMachineHistory.splice(0, stepIndex + 1);
            this.set('featureMachineHistory', newHistory);
          }
        }
      }
      this.saveExtState(STORAGE_KEYS.FEATURE_STATE_HISTORY, this.featureMachineHistory);
    }
  },

  transitionTutorialMachine(currentState, event, extendedState) {
    if (extendedState) {
      this.set('componentState', extendedState);
      this.saveExtState(STORAGE_KEYS.COMPONENT_STATE, extendedState);
    }
    let { actions, value } = TutorialMachine.transition(currentState, event);
    this.saveState('currentState', value);
    this.saveExtState(STORAGE_KEYS.TUTORIAL_STATE, this.currentState);
    this.executeActions(actions, event, 'tutorial');
  },

  transitionFeatureMachine(currentState, event, extendedState) {
    if (!FeatureMachine || !this.currentState.includes('active')) {
      return;
    }
    if (extendedState) {
      this.set('componentState', extendedState);
      this.saveExtState(STORAGE_KEYS.COMPONENT_STATE, extendedState);
    }

    let { actions, value } = FeatureMachine.transition(currentState, event, this.get('componentState'));
    this.saveState('featureState', value);
    this.saveExtState(STORAGE_KEYS.FEATURE_STATE, value);
    this.executeActions(actions, event, 'feature');
    // if all features were completed, the FeatureMachine gets nulled
    // out and won't exist here as there is no next step
    if (FeatureMachine) {
      let next;
      if (this.currentMachine === 'secrets' && value === 'display') {
        next = FeatureMachine.transition(value, 'REPEAT', this.componentState);
      } else {
        next = FeatureMachine.transition(value, 'CONTINUE', this.componentState);
      }
      this.saveState('nextStep', next.value);
    }
  },

  saveExtState(key, value) {
    this.storage().setItem(key, value);
  },

  getExtState(key) {
    return this.storage().getItem(key);
  },

  storageHasKey(key) {
    return Boolean(this.getExtState(key));
  },

  executeActions(actions, event, machineType) {
    let transitionURL;
    let expectedRouteName;
    let router = this.router;

    for (let action of actions) {
      let type = action;
      if (action.type) {
        type = action.type;
      }
      switch (type) {
        case 'render':
          this.set(`${action.level}Component`, action.component);
          break;
        case 'routeTransition':
          expectedRouteName = action.params[0];
          transitionURL = router.urlFor(...action.params).replace(/^\/ui/, '');
          next(() => {
            router.transitionTo(...action.params);
          });
          break;
        case 'saveFeatures':
          this.saveFeatures(event.features);
          break;
        case 'completeFeature':
          this.completeFeature();
          break;
        case 'handleDismissed':
          this.handleDismissed();
          break;
        case 'handlePaused':
          this.handlePaused();
          return;
        case 'handleResume':
          this.handleResume();
          break;
        case 'showTutorialWhenAuthenticated':
          this.set('showWhenUnauthenticated', false);
          break;
        case 'showTutorialAlways':
          this.set('showWhenUnauthenticated', true);
          break;
        case 'continueFeature':
          this.transitionFeatureMachine(this.featureState, 'CONTINUE', this.componentState);
          break;
        default:
          break;
      }
    }
    if (machineType === 'tutorial') {
      return;
    }
    // if we're transitioning in the actions, we want that url,
    // else we want the URL we land on in didTransition in the
    // application route - we'll notify the application route to
    // update the route
    if (transitionURL) {
      this.set('expectedURL', transitionURL);
      this.set('expectedRouteName', expectedRouteName);
      this.set('setURLAfterTransition', false);
    } else {
      this.set('setURLAfterTransition', true);
    }
  },

  handlePaused() {
    let expected = this.expectedURL;
    if (expected) {
      this.saveExtState(STORAGE_KEYS.RESUME_URL, this.expectedURL);
      this.saveExtState(STORAGE_KEYS.RESUME_ROUTE, this.expectedRouteName);
    }
  },

  handleResume() {
    let resumeURL = this.storage().getItem(STORAGE_KEYS.RESUME_URL);
    if (!resumeURL) {
      return;
    }
    this.get('router')
      .transitionTo(resumeURL)
      .followRedirects()
      .then(() => {
        this.set('expectedRouteName', this.storage().getItem(STORAGE_KEYS.RESUME_ROUTE));
        this.set('expectedURL', resumeURL);
        this.initializeMachines();
        this.storage().removeItem(STORAGE_KEYS.RESUME_URL);
      });
  },

  handleDismissed() {
    this.storage().removeItem(STORAGE_KEYS.FEATURE_STATE);
    this.storage().removeItem(STORAGE_KEYS.FEATURE_LIST);
    this.storage().removeItem(STORAGE_KEYS.COMPONENT_STATE);
  },

  saveFeatures(features) {
    this.set('featureList', features);
    this.saveExtState(STORAGE_KEYS.FEATURE_LIST, this.featureList);
    this.buildFeatureMachine();
  },

  buildFeatureMachine() {
    
    if (this.featureList === null) {
      return;
    }
    this.startFeature();
    let nextFeature = this.featureList.length > 1 ? this.featureList.objectAt(1).capitalize() : 'Finish';
    this.set('nextFeature', nextFeature);
    let next;
    if (this.currentMachine === 'secrets' && this.featureState === 'display') {
      next = FeatureMachine.transition(this.featureState, 'REPEAT', this.componentState);
    } else {
      next = FeatureMachine.transition(this.featureState, 'CONTINUE', this.componentState);
    }
    this.saveState('nextStep', next.value);
    let stateNodes = FeatureMachine.getStateNodes(this.featureState);
    this.executeActions(stateNodes.reduce((acc, node) => acc.concat(node.onEntry), []), null, 'feature');
  },

  startFeature() {
    const FeatureMachineConfig = MACHINES[this.featureList.objectAt(0)];
    FeatureMachine = Machine(FeatureMachineConfig);
    this.set('currentMachine', this.featureList.objectAt(0));
    if (this.storageHasKey(STORAGE_KEYS.FEATURE_STATE)) {
      this.saveState('featureState', this.getExtState(STORAGE_KEYS.FEATURE_STATE));
    } else {
      this.saveState('featureState', FeatureMachine.initialState);
    }
    this.saveExtState(STORAGE_KEYS.FEATURE_STATE, this.featureState);
  },

  getCompletedFeatures() {
    if (this.storageHasKey(STORAGE_KEYS.COMPLETED_FEATURES)) {
      return this.getExtState(STORAGE_KEYS.COMPLETED_FEATURES).toArray();
    }
    return [];
  },

  completeFeature() {
    let features = this.featureList;
    let done = features.shift();
    if (!this.getExtState(STORAGE_KEYS.COMPLETED_FEATURES)) {
      let completed = [];
      completed.push(done);
      this.saveExtState(STORAGE_KEYS.COMPLETED_FEATURES, completed);
    } else {
      this.saveExtState(
        STORAGE_KEYS.COMPLETED_FEATURES,
        this.getExtState(STORAGE_KEYS.COMPLETED_FEATURES)
          .toArray()
          .addObject(done)
      );
    }

    this.saveExtState(STORAGE_KEYS.FEATURE_LIST, features.length ? features : null);
    this.storage().removeItem(STORAGE_KEYS.FEATURE_STATE);
    this.storage().removeItem(STORAGE_KEYS.FEATURE_STATE_HISTORY);
    this.set('featureMachineHistory', null);
    if (features.length > 0) {
      this.buildFeatureMachine();
    } else {
      this.storage().removeItem(STORAGE_KEYS.FEATURE_LIST);
      FeatureMachine = null;
      this.transitionTutorialMachine(this.currentState, 'DONE');
    }
  },

  storage() {
    return getStorage();
  },
});
