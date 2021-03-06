import { Match } from './utils';
import { Location } from 'history';

export type RouterStoreState = {
  location: Location;
  match: Match;
  switch: false | { match: Match, matchIndex: number | false };
};

export class Store<State> {

  private listeners: ((state: State) => void)[] = [];

  private state: State;

  constructor(initialState: State) {
    this.state = initialState;

    this.subscribe = this.subscribe.bind(this);
  }

  setState(newState: State): this {
    this.state = newState;
    this.broadcast(this.state);
    return this;
  }

  broadcast(state: State): void {
    this.listeners.forEach(listener => listener(state));
  }

  getState(): State {
    return this.state;
  }

  subscribe(listener: (state: State) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index: number = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

}
