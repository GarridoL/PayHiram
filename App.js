import React from 'react';
import { View, Dimensions, PanResponder, Platform, Modal, TouchableOpacity, Text, Linking, Alert } from 'react-native';
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
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import ModalFooter from 'modules/generic/SecurityAlert';
import { Color, BasicStyles, Routes } from 'common'
import { navigationRef } from 'modules/generic/SecurityAlert';
import DeviceInfo from 'react-native-device-info';
import AuthorizedModal from 'modules/generic/AuthorizedModal';
import Api from 'services/api'

const minutes = 60
class ReduxNavigation extends React.Component{
  constructor(props) {
    super(props);
    this.state = {
      timer: 0,
      timeForInactivityInSecond: 1,
      interval: null,
      showModal: false,
      message: null,
      params: "recover",
      flagModal: false,
      showModals: false
    }
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponderCapture: () => {
        // console.log('user starts touch');
        this.resetInactivityTimeout()
      },
    })
  }


  componentDidMount(){
    this.setState({
      timer: 0,
      showModal: false
    })
    this.getTheme()
    SystemVersion.checkVersion(response => {
      this.setState({isLoading: false})
      if(response == true){
      }
    })


    Linking.getInitialURL().then(url => {
      this.navigate(url);
    });
    Linking.addEventListener('url', this.handleOpenURL);

    const { setMyDevice } = this.props;
    setMyDevice({
      unique_code: DeviceInfo.getUniqueId(),
      model: DeviceInfo.getModel(),
      details: {
        deviceId: DeviceInfo.getDeviceId(),
        manufacturer: DeviceInfo.getManufacturer()
      }
    })
  }

  onFocusFunction = () => {
    Linking.getInitialURL().then(url => {
      this.navigate(url);
    });
    Linking.addEventListener('url', this.handleOpenURL);
  }

  componentWillUnmount() {
    Linking.removeEventListener('url', this.handleOpenURL);
  }

  handleOpenURL = (event) => { // D
    this.navigate(event.url);
  }

  navigate = (url) => { // E
    // const { navigate } = this.props.navigation;
    if(url !== null){
      const route = url.replace(/.*?:\/\//g, '');
      const routeName = route.split('/');
      console.log(routeName)
      const path = routeName[0]

      switch(path.toLowerCase()){
        case 'profile':
          break;
        case 'reset_password':
          navigationRef.current?._navigation.navigate('forgotPasswordStack')
          break;
        case 'login_verification':
          if(routeName.length >= 3){
            navigationRef.current?._navigation.navigate('verifyEmailStack', {
              username: routeName[1],
              code: routeName[2]
            })  
          }else{
            console.log('Invalid route')
          }
          break
      }
      // if(route.split('/')[2] === 'profile') {
      //   // console.log('/.....2ndIF.......')
      //   const {setDeepLinkRoute} = this.props;
      //   setDeepLinkRoute(route);
      // }else if(route.split('/')[2] === 'reset_password') {
      //   const {viewChangePass} = this.props;
      //   viewChangePass(1);
      //   this.props.navigation.navigate('forgotPasswordStack')
      // }else if(path === 'login_verification') {
      //   this.props.navigation.navigate('verifyEmailStack', {
      //     username: route.split('/')[3],
      //     code: route.split('/')[4]
      //   })
      // }
    }
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
    console.log(this.state.timer)
    const { user } = this.props.state;
    if(user){
      this.setState({
        timer: this.state.timer + 1
      })  
    }else{
      BackgroundTimer.stopBackgroundTimer()
      this.setState({
        timer: 0
      })
    }
    
  }

  resetInactivityTimeout = () => {
    const { timer } = this.state;
    const { user, activityModal } = this.props.state;
    const { setActivityModal } = this.props;

    if(user == null){
      BackgroundTimer.stopBackgroundTimer()
      this.setState({
        timer: 0
      })
      setActivityModal(false)
      return
    }


    if(timer > (minutes * 5)){
      // logout here
      this.setState({
        params: "auto",
        message: "You've been away for the past " + parseInt(timer / 60) + " minutes. For your security, kindly login again."
      })
      setActivityModal(true)

    }else if(timer > (minutes * 3) && timer <= (minutes * 5)){
      console.log('show modal here')
      this.setState({
        params: "recover",
        message: "You've have been away for the past " + parseInt(timer / 60) + " minute(s). We want to make sure if it still you!",
      })
      setActivityModal(true)
    }else{
      if(timer > 0){
        BackgroundTimer.stopBackgroundTimer()
      }
      
      this.setState({
        timer: 0
      })

      setActivityModal(false)

      if(timer == 0){
        BackgroundTimer.runBackgroundTimer(() => { 
          this.incrementTime() 
        }, 1000);
      }
    }
    
  }

  back = () => {
    this.setState({ showModals: false })
    this.setState({ flagModal: false })
  }


  generateOtp = () => {
    const { user, myDevice } = this.props.state;
    if (user == null) {
      return
    }
    let parameters = {
      account_id: user.id,
      unique_code: user.device_info[0],
      curr_unique_id: myDevice.unique_code,
      curr_device_id: myDevice.details.deviceId,
      curr_model: myDevice.model
    };
    console.log('[parameter]', parameters)
    this.setState({ isLoading: true })
    Api.request(
      Routes.notificationSettingDeviceOtp,
      parameters,
      (data) => {
        this.setState({ isLoading: false })
        console.log('[data]', data)
      },
      (error) => {
        console.log('[Errora]', error)
        this.setState({ isLoading: false })
      },
    );
  }

  authorize = () => {
    const { user, myDevice } = this.props.state;
    if(user == null || myDevice == null){
      return
    }
    let parameters = {
      account_id: user.id,
      model: myDevice.model,
      unique_code: myDevice.unique_code,
      details: JSON.stringify(myDevice.details),
      status: user.device_info && user.device_info.length > 0 ? 'secondary' : 'primary'
    }
    console.log('[hello]')
    this.setState({isLoading: true})
    Api.request(Routes.deviceCreate, parameters, response => {
      this.setState({isLoading: false})
      this.setState({
        flagModal: true
      })
      if(response.data > 0){
        Alert.alert(
          'Message',
          'Successfully Added! To proceed please login again.',
          [
            {text: 'Ok', onPress: () => {
              const { logout } = this.props;
              logout()
              setTimeout(() => {
                navigationRef.current?._navigation.navigate('loginStack')
              }, 100)
            }, style: 'cancel'}
          ],
          { cancelable: false }
        )
      }else{
        Alert.alert(
          'Message',
          'Please try Again!',
          [
            {text: 'Ok', onPress: () => console.log('Ok'), style: 'cancel'}
          ],
          { cancelable: false }
        )
      }
    })
  }

  renderModalActivity(){
    const { acceptPayment, user, theme, activityModal } = this.props.state
    const { showModal, timer, message } = this.state;
    return(
      <Modal
        visible={activityModal}
        animationType={'slide'}
        transparent={true}>
        <View style={{
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          flex: 1
        }}>
          <View style={{
            minHeight: 100,
            paddingLeft: 10,
            paddingRight: 10,
            paddingTop: 20,
            paddingBottom: 20,
            borderRadius: 12,
            width: '80%',
            marginRight: '10%',
            marginLeft: '10%',
            backgroundColor: 'white'
          }}>

              {
                /*Action buttons*/
              }

              <View style={{
                width: '100%',
                alignItems: 'center'
              }}>
                <FontAwesomeIcon icon={faExclamationTriangle} size={50} color={Color.danger}/>
              </View>

              <Text style={{
                fontSize: 16,
                fontWeight: 'bold',
                paddingTop: 10,
                textAlign: 'center',
              }}>
                Security Alert!
              </Text>

              <Text style={{
                fontSize: 14,
                fontWeight: 'bold',
                paddingTop: 50,
                paddingBottom: 50,
                textAlign: 'center',
                paddingLeft: 20,
                paddingRight: 20,
                color: Color.danger
              }}>
                {this.state.message}
              </Text>

              <ModalFooter
                reset={() => {
                  this.setState({
                    timer: 0
                  })
                  this.props.logout()
                  BackgroundTimer.stopBackgroundTimer()

                  const { setActivityModal } = this.props;
                  setActivityModal(false)
                  setTimeout(() => {
                    this.setState({
                      timer: 0
                    })
                    navigationRef.current?._navigation.navigate('loginStack')
                  }, 100)
                }}
                params={this.state.params}
                resetInactivityTimeout={() => {
                  const { setActivityModal } = this.props;
                  setActivityModal(false)
                  this.setState({
                    timer: 0
                  })
                  setTimeout(() => {
                    this.resetInactivityTimeout()
                  }, 100)
                }}/>
          </View>
        </View>
      </Modal>
    )
  }
  
  render(){
    const { user, activityModal, myDevice } = this.props.state
    const { flagModal, showModals } = this.state;
    return (
      <View style={{
        flex: 1
      }}
      {...this.panResponder.panHandlers}
      >
        <AppContainer ref={navigationRef}/>
        {
          (activityModal && user) && (
            this.renderModalActivity()           
          )
        }
        {
          (user && user.device_info == null && myDevice && flagModal == false) && (
            <AuthorizedModal
            showModal={flagModal ? false : true}
            title={"Use this device as your primary device and receive security notifications once there's an activity of your account while not allowing other device to login unless authorized."}
            auths={true}
            authorize={() => {this.authorize()}}
            ></AuthorizedModal>
          )
        }
        {
          (user && myDevice && user.device_info && user.device_info.indexOf(myDevice.unique_code) < 0 && flagModal == false) && (
            <AuthorizedModal
            showModal={flagModal ? false : true}
            title={"You are seeing this because you are logging in to another device for the first time or you have reached the maximum number of trusted devices that can be added. Click 'Authorize' button to link this device."}
            secondary={true}
            authorized={() => this.generateOtp()}
            navigation={this.props.navigation}
            />
          )
        }
        {
          (user && myDevice && user.device_info && user.device_info.indexOf(myDevice.unique_code) < 0 && flagModal == false && showModals) && (
            <AuthorizedModal
            showModals={showModals}
            title={"Check your notifications, we have sent you a code to your primary device, please enter it below and press 'Verify'."}
            back={() => {this.back()}}
            authorize={() => {this.authorize()}}
            />
          )
       
        }
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
    updateMessagesOnGroup: (message) => dispatch(actions.updateMessagesOnGroup(message)),
    logout: () => dispatch(actions.logout()),
    setActivityModal: (flag) => dispatch(actions.setActivityModal(flag)),
    setActiveRoute: (route) => dispatch(actions.setActiveRoute(route)),
    setMyDevice: (device) => dispatch(actions.setMyDevice(device)),
    updateUser: (user) => dispatch(actions.updateUser(user))
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
            <AppReduxNavigation {...this.props}/>
        </View>
      </Provider>
    );
  }
}