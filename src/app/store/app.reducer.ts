import { ActionReducerMap } from '@ngrx/store';
import { AuthActions } from '../auth/store/auth.action';
import { authReducer, AuthState } from '../auth/store/auth.reducer';
import { ShoppingListActions } from '../shopping-list/store/shopping-list.action';
import {
  shoppingListReducer,
  ShoppingListState
} from '../shopping-list/store/shopping-list.reducer';

export interface AppState {
  shoppingList: ShoppingListState;
  auth: AuthState;
}

export type AppAction = ShoppingListActions | AuthActions;

export const appReducer: ActionReducerMap<AppState, any> = {
  shoppingList: shoppingListReducer,
  auth: authReducer
};
