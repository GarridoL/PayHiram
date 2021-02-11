import React from 'react';
import { View } from 'react-native';
import { Provider, connect } from 'react-redux';
import { createStore } from 'redux';
import rootReducer from '@redux';
import AppNavigation from 'navigation';
import { createAppContainer } from 'react-navigation';
import AsyncStorage from '@react-native-community/async-storage';
import { Helper } from 'common';

import { fcmService } from 'services/broadcasting/FCMService';
import { localNotificationService } from 'services/broadcasting/LocalNotificationService';
const AppContainer = createAppContainer(AppNavigation);

function ReduxNavigation (props) {
  return <AppContainer />
}

const mapStateToProps = state => ({ state: state })
const mapDispatchToProps = dispatch => {
  const { actions } = require('@redux');
  return {
    setTheme: (theme) => dispatch(actions.setTheme(theme))
  };
};
let AppReduxNavigation = connect(mapStateToProps, mapDispatchToProps)(ReduxNavigation)
const store = createStore(rootReducer);

export default class App extends React.Component{
  constructor(props) {
    super(props);
  }

  componentDidMount(){
    this.firebaseNotification()
  }

  firebaseNotification(){
    fcmService.registerAppWithFCM()
    fcmService.register(this.onRegister, this.onNotification, this.onOpenNotification)
    localNotificationService.configure(this.onOpenNotification, 'Payhiram')
    return () => {
      console.log("[App] unRegister")
      fcmService.unRegister()
      localNotificationService.unRegister()
    }
  }

  onRegister = (token) => {
    console.log("[App] onRegister", token)
  }

  onNotification = (notify) => {
    console.log("[App] onNotification", notify)
    const options = {
      soundName: 'default',
      playSound: true
    }

    localNotificationService.showNotification(
      0,
      notify.title,
      notify.body,
      notify,
      options,
      "test"
    )
  }

  onOpenNotification = (notify) => {
    console.log("[App] onOpenNotification", notify )
  }

  storeData = async (key, value) => {
    try {
      await AsyncStorage.setItem(`${Helper.APP_NAME}primary`, value)
    } catch (e) {
      console.log(e)
    }
  }

  render() {
    console.ignoredYellowBox = ['Warning: Each'];
    return (
      <Provider store={store}>
        <View style={{
            flex: 1,
            backgroundColor: '#ffffff'
          }}>
            <AppReduxNavigation />
        </View>
      </Provider>
    );
  }
}