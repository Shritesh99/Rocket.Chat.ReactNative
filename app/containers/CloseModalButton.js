import React from 'react';
import PropTypes from 'prop-types';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { COLOR_TEXT } from '../constants/colors';

const styles = StyleSheet.create({
	button: {
		width: 25,
		height: 25,
		marginTop: 5
	},
	icon: {
		color: COLOR_TEXT
	}
});

export default class CloseModalButton extends React.PureComponent {
	static propTypes = {
		navigation: PropTypes.object.isRequired
	}

	render() {
		return (
			<TouchableOpacity onPress={() => this.props.navigation.goBack()} style={styles.button}>
				<Icon
					style={styles.icon}
					name='close'
					size={25}
				/>
			</TouchableOpacity>
		);
	}
}
