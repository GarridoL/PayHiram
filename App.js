import React from 'react';
import { View } from 'react-native';
import { Provider, connect } from 'react-redux';
import { createStore } from 'redux';
import rootReducer from '@redux';
import AppNavigation from 'navigation';
import { createAppContainer } from 'react-navigation';
import AsyncStorage from '@react-native-community/async-storage';
import { Helper } from 'common';
import SystemVersion from 'services/System.js';

// import { fcmService } from 'services/broadcasting/FCMService';
// import { localNotificationService } from 'services/broadcasting/LocalNotificationService';
const AppContainer = createAppContainer(AppNavigation);

class ReduxNavigation extends React.Component{
  constructor(props) {
    super(props);
  }


  componentDidMount(){
    this.firebaseNotification()    
    this.getTheme()
    SystemVersion.checkVersion(response => {
      this.setState({isLoading: false})
      if(response == true){
      }
    })
  }

  // firebaseNotification(){
  //   const { user } = this.props.state;
  //   if(user == null){
  //     return
  //   }
  //   fcmService.registerAppWithFCM()
  //   fcmService.register(this.onRegister, this.onNotification, this.onOpenNotification)
  //   localNotificationService.configure(this.onOpenNotification, 'Payhiram')
  //   return () => {
  //     console.log("[App] unRegister")
  //     fcmService.unRegister()
  //     localNotificationService.unRegister()
  //   }
  // }

  // onRegister = (token) => {
  //   console.log("[App] onRegister", token)
  // }

  // onNotification = (notify) => {
  //   console.log("[App] onNotification", notify)
  //   const options = {
  //     soundName: 'default',
  //     playSound: true
  //   }

  //   localNotificationService.showNotification(
  //     0,
  //     notify.title,
  //     notify.body,
  //     notify,
  //     options,
  //     "test"
  //   )
  // }


  firebaseNotification(){
    const { user, messengerGroup } = this.props.state;
    if(user == null){
      return
    }
    fcmService.registerAppWithFCM()
    fcmService.registerOnOpen(this.onRegister, this.onNotification)
    fcmService.subscribeTopic('Message-' + user.id)
    // return () => {
    //   console.log("[App] unRegister")
    //   fcmService.unRegister()
    // }
  }

  onRegister = (token) => {
    console.log("[App] onRegister", token)
  }

  onNotification = (notify) => {
    const { user } = this.props.state;
    console.log("[Messages] onNotification", notify)
    let { data } = notify
    if(user == null || data == null){
      return
    }
    switch(data.topic){
      case 'Message': {
        const { messengerGroup } = this.props.state;
        if(messengerGroup == null){
          if(parseInt(data.account_id) != user.id){
            const { setUnReadMessages } = this.props;
            setUnReadMessages(data);
          }
        }else{
          if(parseInt(data.messenger_group_id) === messengerGroup.id && parseInt(data.account_id) != user.id){
            const { updateMessagesOnGroup } = this.props;
            updateMessagesOnGroup(data);
          }
        }
      }
      break;
    }

    // const options = {
    //   soundName: 'default',
    //   playSound: true
    // }

    // localNotificationService.showNotification(
    //   0,
    //   notify.title,
    //   notify.body,
    //   notify,
    //   options,
    //   "test"
    // )
  }



  getTheme = async () => {
    try {
      const primary = await AsyncStorage.getItem(Helper.APP_NAME + 'primary');
      const secondary = await AsyncStorage.getItem(Helper.APP_NAME + 'secondary');
      const tertiary = await AsyncStorage.getItem(Helper.APP_NAME + 'tertiary');
      const fourth = await AsyncStorage.getItem(Helper.APP_NAME + 'fourth');
      if(primary != null && secondary != null && tertiary != null) {
        const { setTheme } = this.props;
        setTheme({
          primary: primary,
          secondary: secondary,
          tertiary: tertiary,
          fourth: fourth
        })
      }
    } catch (e) {
      console.log(e)
    }
  }


  onOpenNotification = (notify) => {
    console.log("[App] onOpenNotification", notify )
  }

  render(){
    return <AppContainer />
  }
}

const mapStateToProps = state => ({ state: state })
const mapDispatchToProps = dispatch => {
  const { actions } = require('@redux');
  return {
    setTheme: (theme) => dispatch(actions.setTheme(theme)),
    setUnReadMessages: (messages) => dispatch(actions.setUnReadMessages(messages)),
    updateMessagesOnGroup: (message) => dispatch(actions.updateMessagesOnGroup(message))
  };
};
let AppReduxNavigation = connect(mapStateToProps, mapDispatchToProps)(ReduxNavigation)
const store = createStore(rootReducer);

export default class App extends React.Component{
  constructor(props) {
    super(props);
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