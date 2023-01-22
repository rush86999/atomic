import React from 'react';
import {StyleSheet, Dimensions, FlatList, Animated} from 'react-native';
import {Block, theme} from 'galio-framework';

const {width} = Dimensions.get('screen');
import materialTheme from '../constants/Theme';

const defaultMenu = [
  {id: 'popular', title: 'Popular'},
  {id: 'beauty', title: 'Beauty'},
  {id: 'cars', title: 'Cars'},
  {id: 'motocycles', title: 'Motocycles'},
];

export default class MenuHorizontal extends React.Component {
  static defaultProps = {
    data: defaultMenu,
    initialIndex: null,
  };

  state = {
    active: null,
  };

  componentDidMount() {
    const {initialIndex} = this.props;
    initialIndex && this.selectMenu(initialIndex);
  }

  animatedValue = new Animated.Value(1);

  animate() {
    this.animatedValue.setValue(0);

    Animated.timing(this.animatedValue, {
      toValue: 1,
      duration: 300,
    }).start();
  }

  menuRef = React.createRef();

  onScrollToIndexFailed = () => {
    this.menuRef.current.scrollToIndex({
      index: 0,
      viewPosition: 0.5,
    });
  };

  selectMenu = (id) => {
    this.setState({active: id});

    this.menuRef.current.scrollToIndex({
      index: this.props.data.findIndex((item) => item.id === id),
      viewPosition: 0.5,
    });

    this.animate();
    this.props.onChange && this.props.onChange(id);
  };

  renderItem = (item) => {
    const isActive = this.state.active === item.id;

    const textColor = this.animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [
        materialTheme.COLORS.MUTED,
        isActive ? materialTheme.COLORS.ACTIVE : materialTheme.COLORS.MUTED,
      ],
      extrapolate: 'clamp',
    });

    const width = this.animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', isActive ? '100%' : '0%'],
      extrapolate: 'clamp',
    });

    return (
      <Block style={styles.titleContainer}>
        <Animated.Text
          style={[styles.menuTitle, {color: textColor}]}
          onPress={() => this.selectMenu(item.id)}>
          {item.title}
        </Animated.Text>
        <Animated.View
          style={{
            height: 2,
            width,
            backgroundColor: materialTheme.COLORS.ACTIVE,
          }}
        />
      </Block>
    );
  };

  renderMenu = () => {
    const {data, ...props} = this.props;

    return (
      <FlatList
        {...props}
        data={data}
        horizontal={true}
        ref={this.menuRef}
        extraData={this.state}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        onScrollToIndexFailed={this.onScrollToIndexFailed}
        renderItem={({ item }) => this.renderItem(item)}
        contentContainerStyle={styles.menu}
      />
    )
  }

  render() {
    return (
      <Block style={[styles.container, styles.shadow]}>
        {this.renderMenu()}
      </Block>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    width: width,
    backgroundColor: theme.COLORS.WHITE,
    zIndex: 2,
  },
  shadow: {
    shadowColor: theme.COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    shadowOpacity: 0.2,
    elevation: 4,
  },
  menu: {
    paddingHorizontal: theme.SIZES.BASE * 2.5,
    paddingTop: 8,
    paddingBottom: 0,
  },
  titleContainer: {
    alignItems: 'center',
  },
  menuTitle: {
    fontWeight: '300',
    fontSize: 16,
    lineHeight: 28,
    paddingHorizontal: 16,
    color: materialTheme.COLORS.MUTED
  },
});
