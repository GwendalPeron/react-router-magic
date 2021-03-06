import isFunction = require('lodash.isfunction');
import { RouterStoreState } from './Store';
import { MouseEvent } from 'react';
import { LocationDescriptorObject, History, Location } from 'history';
import isString = require('lodash.isstring');

export type Match = null | undefined | boolean | object;

export type ValOrFunc<Result> = Result | ((location: Location, parentMatch: Match) => Result);

export type NavParams = {
  href: string;
  match: Match;
  location: Location;
  navigate: () => void;
  handleAnchorClick: (event: MouseEvent<any>) => void;
};

export type StringOrLocationDescriptorObject = string | LocationDescriptorObject;

export type ToProps = (
  StringOrLocationDescriptorObject |
  ((currentMatch: Match, location: Location, parentMatch: Match) => StringOrLocationDescriptorObject)
);

export function execValOrFunc<Val>(
  valOrFunc: ValOrFunc<Val>,
  location: Location,
  parentMatch: Match,
): Val {
  if (isFunction(valOrFunc)) {
    return valOrFunc(location, parentMatch);
  }
  return valOrFunc;
}

export function checkSwitchState(
  props: { switchIndex?: number | false },
  parentRouterState: RouterStoreState,
  match: Match,
): Match {
  if (parentRouterState.switch === false && props.switchIndex !== undefined) {
    console.warn(`You should not set switchIndex props yourself`);
  }
  if (parentRouterState.switch && props.switchIndex === undefined) {
    console.warn(`Error: Switch children are supposed to have switchIndex passed from parent`);
  }
  // in a switch but there are no match
  if (
    parentRouterState.switch &&
    parentRouterState.switch.matchIndex === false
  ) {
    return false;
  }
  // in a switch but switchIndex does not match
  if (
    parentRouterState.switch &&
    props.switchIndex !== undefined &&
    parentRouterState.switch.matchIndex !== props.switchIndex
  ) {
    return false;
  }
  // ok match !
  return match;
}

export function isModifiedEvent(event: MouseEvent<any>): boolean {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}

export function createNavParams(
  to: ToProps,
  history: History,
  location: Location,
  replace: boolean = false,
  match?: ValOrFunc<Match>,
  parentMatch?: Match,
): NavParams {
  const doMatch: Match = match ? execValOrFunc(match, location, parentMatch) : null;
  const toLocation: LocationDescriptorObject = execTo(to, doMatch, location, parentMatch);
  const href: string = history.createHref(toLocation);
  const doNavigate: () => void = () => navigate(toLocation, history, replace);
  const params: NavParams = {
    href: href,
    navigate: doNavigate,
    match: doMatch,
    location: location,
    handleAnchorClick: createHandleAnchorClick(doNavigate),
  };
  return params;
}

export function createHandleAnchorClick(navigate: () => void):
  (event: MouseEvent<any>, target?: string) => void {
  return (event: MouseEvent<any>, target?: string) => {
    if (
      !event.defaultPrevented && // onClick prevented default
      event.button === 0 && // ignore right clicks
      !target && // let browser handle "target=_blank" etc.
      !isModifiedEvent(event) // ignore clicks with modifier keys
    ) {
      event.preventDefault();
      navigate();
    }
  };
}

export function navigate(to: LocationDescriptorObject, history: History, replace: boolean = false): void {
  if (replace) {
    history.replace(to);
  } else {
    history.push(to);
  }
}

export function execTo(
  to: ToProps,
  match: Match,
  location: Location,
  parentMatch?: Match,
): LocationDescriptorObject {
  const toExecuted: StringOrLocationDescriptorObject = isFunction(to) ? (
    to(match, location, parentMatch)
  ) : to;
  return isString(toExecuted) ? { pathname: toExecuted } : toExecuted;
}

const REACT_STATICS: { [key: string]: boolean } = {
  childContextTypes: true,
  contextTypes: true,
  defaultProps: true,
  displayName: true,
  getDefaultProps: true,
  mixins: true,
  propTypes: true,
  type: true,
};

const KNOWN_STATICS: {[key: string]: boolean} = {
  name: true,
  length: true,
  prototype: true,
  caller: true,
  arguments: true,
  arity: true,
};

export function hoistNonReactStatics(
  targetComponent: any,
  sourceComponent: any,
  customStatics?: { [key: string]: boolean },
) {
  if (typeof sourceComponent !== 'string') { // don't hoist over string (html) components
    let keys: string[] = Object.getOwnPropertyNames(sourceComponent);

    for (let i = 0; i < keys.length; ++i) {
      if (!REACT_STATICS[keys[i]] && !KNOWN_STATICS[keys[i]] && (!customStatics || !customStatics[keys[i]])) {
        try {
          targetComponent[keys[i]] = sourceComponent[keys[i]];
        } catch (error) {
          console.warn(error);
        }
      }
    }
  }

  return targetComponent;
}
