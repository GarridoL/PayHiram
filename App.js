import React from 'react';
import { View, ActivityIndicator, PanResponder, Modal, TouchableOpacity, Text, Linking, Alert, PermissionsAndroid  } from 'react-native';
import { Provider, connect } from 'react-redux';
import { createStore } from 'redux';
import rootReducer from '@redux';
import AppNavigation from 'navigation';
import { createAppContainer } from 'react-navigation';
import AsyncStorage from '@react-native-community/async-storage';
import { Helper } from 'common';
import SystemVersion from 'services/System.js';
const AppContainer = createAppContainer(AppNavigation);
import BackgroundTimer from 'react-native-background-timer';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import ModalFooter from 'modules/generic/SecurityAlert';
import { Color } from 'common'
import DeviceNotificationModal from 'modules/generic/DeviceNotificationModal';
import { navigationRef } from 'modules/generic/SecurityAlert';
import DeviceInfo from 'react-native-device-info';
import Geolocation from '@react-native-community/geolocation';
import Geocoder from 'react-native-geocoding';
import config from 'src/config'

const minutes = 60
class ReduxNavigation extends React.Component{
  constructor(props) {
    super(props);
    this.state = {
      timer: 0,
      timeForInactivityInSecond: 1,
      interval: null,
      message: null,
      params: "recover"
    }
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponderCapture: () => {
        // console.log('user starts touch');
        // this.resetInactivityTimeout()
      },
    })
  }


  componentDidMount(){
    this.setState({
      timer: 0
    })
    Geocoder.init(config.GOOGLE.API_KEY) // need google api key
    this.getPermission()
    this.getTheme()
    SystemVersion.checkVersion(response => {
      if(response == true){
      }
    })

    const { setMyDevice } = this.props;
    setMyDevice({
      unique_code: DeviceInfo.getUniqueId(),
      model: DeviceInfo.getModel(),
      details: {
        deviceId: DeviceInfo.getDeviceId(),
        manufacturer: DeviceInfo.getManufacturer()
      }
    })

    Linking.getInitialURL().then(url => {
      this.navigate(url);
    });
    Linking.addEventListener('url', this.handleOpenURL);
    
    
    SystemVersion.askPermission()
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
      console.log({
        index: index,
        primary
      })
      if(primary != null && secondary != null && tertiary != null) {
        const { setTheme } = this.props;
        setTheme({
          primary: primary,
          secondary: secondary,
          tertiary: tertiary,
          fourth: fourth,
          index: parseInt(index)
        })
      }else{
        const { setTheme } = this.props;
        setTheme({
          primary: '#3F0050',
          secondary: '#22B173',
          tertiary: '#F2C94C',
          fourth: '#000000',
          index: 0
        })
      }
    } catch (e) {
      console.log(e)
    }
  }

   //getting locations
  //getting location access permission
  getPermission = async() => {
    if(Platform.OS === 'ios'){
      this.getOneTimeLocation()
      this.subscribeLocation()
    }else{
      console.log('=====>>>>>=');
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      )
      console.log('=====>>>>>=', granted);
      if(granted === PermissionsAndroid.RESULTS.GRANTED){
        this.getOneTimeLocation()
        this.subscribeLocation()
      }
    }
  }

  getOneTimeLocation = () => {
    console.log('Getting location .......');
    Geolocation.getCurrentPosition(
      (position) => {
        console.log('[CURRENT LONGITUDE]', position.coords.longitude);
        console.log('[CURRENT LATITUDE]', position.coords.latitude);
        this.decodeLocation(position.coords.longitude, position.coords.latitude)
      }, (error) => {
        console.log('[LOCATION ERROR]', error.message);
      },
      {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 1000
      }
    )
  }

  subscribeLocation = () => {
    let watchId = Geolocation.watchPosition(
      (position) => {
        console.log('[WATCH LONGITUDE===]', position.coords.longitude);
        console.log('[WATCH LATITUDE]', position.coords.latitude);
        this.decodeLocation(position.coords.longitude, position.coords.latitude)
      }, (error) => {
        console.log('[WATCH LOCATION ERROR]', error.message);
      },
      {
        enableHighAccuracy: false,
        maximumAge: 1000
      }
    )
  }

  decodeLocation = (longitude, latitude) => {
    const {setCountryCode} = this.props
    Geocoder.from(latitude, longitude).then(res => {
      console.log('[GEOCODING LOCATION]', res.results[0].address_components[0]);
      let country_code = null

      let address = res.results[0].formatted_address;
      res.results[0].address_components.forEach(el => {
        if(el.types.includes('country')){
          country_code = el.short_name;
        }
      })

      console.log('[CURRENT ADDRESS]', country_code);
      setCountryCode(country_code !== 'US' || country_code !== 'PH' ? 'others' : country_code.toLowerCase())

    }).catch(error => {
      console.log('[GEOCODING ERROR]', error);
    })
  }
  //===========================================


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

  renderModalActivity(){
    const { activityModal } = this.props.state
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
    const { user, activityModal, myDevice, deviceNotification } = this.props.state
    console.l
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
          (deviceNotification) && (
            <DeviceNotificationModal
              showModal={deviceNotification ? true : false}
              close={() => {
                const { showDeviceNotification } = this.props;
                showDeviceNotification(null)
              }}
              navigation={this.props.navigation}
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
    showDeviceNotification: (deviceNotification) => dispatch(actions.showDeviceNotification(deviceNotification)),
    updateUser: (user) => dispatch(actions.updateUser(user)),
    setCountryCode: (location) => dispatch(actions.setCountryCode(location))
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
