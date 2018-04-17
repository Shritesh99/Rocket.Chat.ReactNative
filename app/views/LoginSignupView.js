import React from 'react';
import Spinner from 'react-native-loading-spinner-overlay';
import PropTypes from 'prop-types';
import { Text, View, ScrollView, TouchableOpacity, SafeAreaView, WebView, Platform, LayoutAnimation, Image } from 'react-native';
import { connect } from 'react-redux';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Base64 } from 'js-base64';
import Modal from 'react-native-modal';
import TinyColor from 'tinycolor2';

import RocketChat from '../lib/rocketchat';
import { open, close } from '../actions/login';

import styles from './Styles';
import scrollPersistTaps from '../utils/scrollPersistTaps';
import random from '../utils/random';
import Touch from '../utils/touch';
import { COLOR_BUTTON_PRIMARY, COLOR_LOGIN_BACKGROUND } from '../constants/colors';

const userAgentAndroid = 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1';
const userAgent = Platform.OS === 'ios' ? 'UserAgent' : userAgentAndroid;

@connect(state => ({
	server: state.server.server,
	login: state.login,
	Accounts_EmailOrUsernamePlaceholder: state.settings.Accounts_EmailOrUsernamePlaceholder,
	Accounts_PasswordPlaceholder: state.settings.Accounts_PasswordPlaceholder,
	Accounts_OAuth_Facebook: state.settings.Accounts_OAuth_Facebook,
	Accounts_OAuth_Github: state.settings.Accounts_OAuth_Github,
	Accounts_OAuth_Gitlab: state.settings.Accounts_OAuth_Gitlab,
	Accounts_OAuth_Google: state.settings.Accounts_OAuth_Google,
	Accounts_OAuth_Linkedin: state.settings.Accounts_OAuth_Linkedin,
	Accounts_OAuth_Meteor: state.settings.Accounts_OAuth_Meteor,
	Accounts_OAuth_Twitter: state.settings.Accounts_OAuth_Twitter,
	services: state.login.services
}), dispatch => ({
	loginOAuth: params => RocketChat.login(params),
	open: () => dispatch(open()),
	close: () => dispatch(close())
}))
export default class LoginView extends React.Component {
	static propTypes = {
		loginOAuth: PropTypes.func.isRequired,
		open: PropTypes.func.isRequired,
		close: PropTypes.func.isRequired,
		navigation: PropTypes.object.isRequired,
		login: PropTypes.object,
		server: PropTypes.string,
		Accounts_EmailOrUsernamePlaceholder: PropTypes.bool,
		Accounts_PasswordPlaceholder: PropTypes.string,
		Accounts_OAuth_Facebook: PropTypes.bool,
		Accounts_OAuth_Github: PropTypes.bool,
		Accounts_OAuth_Gitlab: PropTypes.bool,
		Accounts_OAuth_Google: PropTypes.bool,
		Accounts_OAuth_Linkedin: PropTypes.bool,
		Accounts_OAuth_Meteor: PropTypes.bool,
		Accounts_OAuth_Twitter: PropTypes.bool,
		services: PropTypes.object
	}

	constructor(props) {
		super(props);

		this.state = {
			modalVisible: false,
			oAuthUrl: '',
			showSocialButtons: false
		};
		this.redirectRegex = new RegExp(`(?=.*(${ this.props.server }))(?=.*(credentialToken))(?=.*(credentialSecret))`, 'g');
	}

	componentDidMount() {
		this.props.open();
	}

	componentWillReceiveProps(nextProps) {
		if (this.props.services !== nextProps.services) {
			LayoutAnimation.easeInEaseOut();
		}
	}

	componentWillUnmount() {
		this.props.close();
	}

	onPressFacebook = () => {
		const { appId } = this.props.services.facebook;
		const endpoint = 'https://m.facebook.com/v2.9/dialog/oauth';
		const redirect_uri = `${ this.props.server }/_oauth/facebook?close`;
		const scope = 'email';
		const state = this.getOAuthState();
		const params = `?client_id=${ appId }&redirect_uri=${ redirect_uri }&scope=${ scope }&state=${ state }&display=touch`;
		this.openOAuth(`${ endpoint }${ params }`);
	}

	onPressGithub = () => {
		const { clientId } = this.props.services.github;
		const endpoint = `https://github.com/login?client_id=${ clientId }&return_to=${ encodeURIComponent('/login/oauth/authorize') }`;
		const redirect_uri = `${ this.props.server }/_oauth/github?close`;
		const scope = 'user:email';
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&scope=${ scope }&state=${ state }`;
		this.openOAuth(`${ endpoint }${ encodeURIComponent(params) }`);
	}

	onPressGitlab = () => {
		const { clientId } = this.props.services.gitlab;
		const endpoint = 'https://gitlab.com/oauth/authorize';
		const redirect_uri = `${ this.props.server }/_oauth/gitlab?close`;
		const scope = 'read_user';
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&scope=${ scope }&state=${ state }&response_type=code`;
		this.openOAuth(`${ endpoint }${ params }`);
	}

	onPressGoogle = () => {
		const { clientId } = this.props.services.google;
		const endpoint = 'https://accounts.google.com/o/oauth2/auth';
		const redirect_uri = `${ this.props.server }/_oauth/google?close`;
		const scope = 'email';
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&scope=${ scope }&state=${ state }&response_type=code`;
		this.openOAuth(`${ endpoint }${ params }`);
	}

	onPressLinkedin = () => {
		const { clientId } = this.props.services.linkedin;
		const endpoint = 'https://www.linkedin.com/uas/oauth2/authorization';
		const redirect_uri = `${ this.props.server }/_oauth/linkedin?close`;
		const scope = 'r_emailaddress';
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&scope=${ scope }&state=${ state }&response_type=code`;
		this.openOAuth(`${ endpoint }${ params }`);
	}

	onPressMeteor = () => {
		const { clientId } = this.props.services['meteor-developer'];
		const endpoint = 'https://www.meteor.com/oauth2/authorize';
		const redirect_uri = `${ this.props.server }/_oauth/meteor-developer`;
		const state = this.getOAuthState();
		const params = `?client_id=${ clientId }&redirect_uri=${ redirect_uri }&state=${ state }&response_type=code`;
		this.openOAuth(`${ endpoint }${ params }`);
	}

	onPressTwitter = () => {
		const state = this.getOAuthState();
		const url = `${ this.props.server }/_oauth/twitter/?requestTokenAndRedirect=true&state=${ state }`;
		this.openOAuth(url);
	}

	getOAuthState = () => {
		const credentialToken = random(43);
		return Base64.encodeURI(JSON.stringify({ loginStyle: 'popup', credentialToken, isCordova: true }));
	}

	openOAuth = (oAuthUrl) => {
		this.setState({ oAuthUrl, modalVisible: true });
	}

	register = () => {
		this.props.navigation.navigate({ key: 'Register', routeName: 'Register' });
	}

	closeOAuth = () => {
		this.setState({ modalVisible: false });
	}

	toggleSocialButtons = () => {
		this.setState({ showSocialButtons: !this.state.showSocialButtons });
	}

	render() {
		return (
			[
				<ScrollView
					key='login-view'
					style={styles.container}
					{...scrollPersistTaps}
				>
					<SafeAreaView>
						<View style={{ alignItems: 'center', justifyContent: 'center' }}>
							<Image
								source={require('../../static/images/logo.png')}
								style={styles.loginLogo}
								resizeMode='center'
							/>
							<Text style={[styles.loginText, { color: '#81848A', fontSize: 20 }]}>Prepare to take off with</Text>
							<Text style={[styles.loginText, { fontSize: 20 }]}>the ultimate chat platform</Text>
							<Image source={{ uri: 'https://via.placeholder.com/200x200' }} style={{ width: 200, height: 200, marginVertical: 10 }} />
							<Touch
								style={[styles.loginButtonContainer, styles.marginBottom10, styles.loginButtonPrimary]}
								onPress={() => this.props.navigation.navigate({ key: 'Login', routeName: 'Login' })}
								accessibilityTraits='button'
								underlayColor={TinyColor(COLOR_BUTTON_PRIMARY).darken(20)}
							>
								<Text style={styles.loginButtonText}>I have an account</Text>
							</Touch>
							<Touch
								style={[styles.loginButtonContainer, styles.marginBottom10]}
								onPress={() => this.props.navigation.navigate({ key: 'Register', routeName: 'Register' })}
								accessibilityTraits='button'
								underlayColor={TinyColor('white').darken(10)}
							>
								<Text style={[styles.loginButtonText, { color: '#292E35' }]}>Create account</Text>
							</Touch>

							<View style={{ backgroundColor: '#dddddd', width: '100%', borderRadius: 2, padding: 16, paddingTop: 20, marginBottom: 40 }}>
								<Text style={[styles.loginButtonText, { color: '#292E35', textAlign: 'left' }]}>
									Or continue using Social accounts
								</Text>
								<View style={styles.loginOAuthButtons} key='services'>
									{this.props.Accounts_OAuth_Facebook && this.props.services.facebook &&
										<TouchableOpacity
											style={[styles.oauthButton, styles.facebookButton]}
											onPress={this.onPressFacebook}
										>
											<Icon name='facebook' size={20} color='#ffffff' />
										</TouchableOpacity>
									}
									{this.props.Accounts_OAuth_Github && this.props.services.github &&
										<TouchableOpacity
											style={[styles.oauthButton, styles.githubButton]}
											onPress={this.onPressGithub}
										>
											<Icon name='github' size={20} color='#ffffff' />
										</TouchableOpacity>
									}
									{this.props.Accounts_OAuth_Gitlab && this.props.services.gitlab &&
										<TouchableOpacity
											style={[styles.oauthButton, styles.gitlabButton]}
											onPress={this.onPressGitlab}
										>
											<Icon name='gitlab' size={20} color='#ffffff' />
										</TouchableOpacity>
									}
									{this.props.Accounts_OAuth_Google && this.props.services.google &&
										<TouchableOpacity
											style={[styles.oauthButton, styles.googleButton]}
											onPress={this.onPressGoogle}
										>
											<Icon name='google' size={20} color='#ffffff' />
										</TouchableOpacity>
									}
									{this.props.Accounts_OAuth_Linkedin && this.props.services.linkedin &&
										<TouchableOpacity
											style={[styles.oauthButton, styles.linkedinButton]}
											onPress={this.onPressLinkedin}
										>
											<Icon name='linkedin' size={20} color='#ffffff' />
										</TouchableOpacity>
									}
									{this.props.Accounts_OAuth_Meteor && this.props.services['meteor-developer'] &&
										<TouchableOpacity
											style={[styles.oauthButton, styles.meteorButton]}
											onPress={this.onPressMeteor}
										>
											<MaterialCommunityIcons name='meteor' size={25} color='#ffffff' />
										</TouchableOpacity>
									}
									{this.props.Accounts_OAuth_Twitter && this.props.services.twitter &&
										<TouchableOpacity
											style={[styles.oauthButton, styles.twitterButton]}
											onPress={this.onPressTwitter}
										>
											<Icon name='twitter' size={20} color='#ffffff' />
										</TouchableOpacity>
									}
								</View>
							</View>
						</View>
						<Spinner visible={this.props.login.isFetching} textContent='Loading...' textStyle={{ color: '#FFF' }} />
					</SafeAreaView>
				</ScrollView>,
				<Modal
					key='modal-oauth'
					visible={this.state.modalVisible}
					animationType='slide'
					style={styles.oAuthModal}
					onBackButtonPress={this.closeOAuth}
					useNativeDriver
				>
					<WebView
						source={{ uri: this.state.oAuthUrl }}
						userAgent={userAgent}
						onNavigationStateChange={(webViewState) => {
							const url = decodeURIComponent(webViewState.url);
							if (this.redirectRegex.test(url)) {
								const parts = url.split('#');
								const credentials = JSON.parse(parts[1]);
								this.props.loginOAuth({ oauth: { ...credentials } });
								this.setState({ modalVisible: false });
							}
						}}
					/>
					<Icon name='close' size={30} style={styles.closeOAuth} onPress={this.closeOAuth} />
				</Modal>
			]
		);
	}
}
