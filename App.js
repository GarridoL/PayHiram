import React from 'react';
import { View, Dimensions, PanResponder, Platform } from 'react-native';
import { Provider, connect } from 'react-redux';
import { createStore } from 'redux';
import rootReducer from '@redux';
import AppNavigation from 'navigation';
import { createAppContainer } from 'react-navigation';
import AsyncStorage from '@react-native-community/async-storage';
import { Helper } from 'common';
import SystemVersion from 'services/System.js';
const AppContainer = createAppContainer(AppNavigation);
const height = Math.round(Dimensions.get('window').height);
const width = Math.round(Dimensions.get('window').width);
import BackgroundTimer from 'react-native-background-timer';

class ReduxNavigation extends React.Component{
  constructor(props) {
    super(props);
    this.state = {
      timer: false,
      timeForInactivityInSecond: 1,
      interval: null
    }
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponderCapture: () => {
        // console.log('user starts touch');
        this.resetInactivityTimeout()
      },
    })
  }


  componentDidMount(){
    this.getTheme()
    SystemVersion.checkVersion(response => {
      this.setState({isLoading: false})
      if(response == true){
      }
    })
    this.resetInactivityTimeout()
  }

  getTheme = async () => {
    try {
      const primary = await AsyncStorage.getItem(Helper.APP_NAME + 'primary');
      const secondary = await AsyncStorage.getItem(Helper.APP_NAME + 'secondary');
      const tertiary = await AsyncStorage.getItem(Helper.APP_NAME + 'tertiary');
      const fourth = await AsyncStorage.getItem(Helper.APP_NAME + 'fourth');
      const index = await AsyncStorage.getItem(Helper.APP_NAME + 'index');
      if(primary != null && secondary != null && tertiary != null) {
        const { setTheme } = this.props;
        setTheme({
          primary: primary,
          secondary: secondary,
          tertiary: tertiary,
          fourth: fourth,
          index: index
        })
      }
    } catch (e) {
      console.log(e)
    }
  }


  onOpenNotification = (notify) => {
    console.log("[App] onOpenNotification", notify )
  }

  incrementTime = () => {
    console.log('Timer is ' + this.state.timer)
    this.setState({
      timer: this.state.timer + 1
    })
  }

  resetInactivityTimeout = () => {
    const { timer } = this.state;

    if(timer > 20){
      console.log('show modal here')
    }else{
      BackgroundTimer.stopBackgroundTimer()
      
      this.setState({
        timer: 0
      })

      BackgroundTimer.runBackgroundTimer(() => { 
        this.incrementTime() 
      }, 1000);
    }
    
  }

  render(){
    const { acceptPayment, user } = this.props.state
    return (
      <View style={{
        flex: 1
      }}
      {...this.panResponder.panHandlers}
      >
        <AppContainer />
      </View>
    )
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