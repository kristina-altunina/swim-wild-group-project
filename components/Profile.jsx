import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  LayoutAnimation,
} from "react-native";

import { colours } from "../styles/base";
import NavBar from "./NavBar";
import { tokenRefresh } from "../firebaseConfig";
import { BACKEND_API_URL, DEFAULT_IMAGE_URL } from "@env";
import { useState, useEffect } from "react";
import { formatDate, simpleAlert } from "../extentions";
import SwimFilter from "./Profile/SwimFilter";
import {
  addMonthToSwims,
  coldest,
  favouriteSwim,
  hottest,
  swimTheLakes,
  swimsThisMonth,
  totalDistance,
  totalLocations,
  totalMinutes,
} from "../scripts/swims";
import { SwimRecord } from "./Profile/SwimRecord";
import { useFonts } from "expo-font";
import { useAssets } from "expo-asset";
import { login, refreshToken } from "../redux/reducers";
import { useSelector, useDispatch } from "react-redux";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";
export default Profile = ({ navigation, route }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState({});
  const [swims, setSwims] = useState([]);
  const [filtSwims, setFiltSwims] = useState([]);
  const [expand, setExpand] = useState(false);
  const [fontsLoaded] = useFonts({
    "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-Light": require("../assets/fonts/Poppins-Light.ttf"),
    "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-Regular_Italic": require("../assets/fonts/Poppins-Italic.ttf"),
    "Poppins-Bold_Italic": require("../assets/fonts/Poppins-BoldItalic.ttf"),
  });
  const [assets, error] = useAssets([require("../assets/icons/pencil.png")]);

  const dispatch = useDispatch();

  const token = route.params.refresh_token;
  const guid = route.params.guid;

  async function getProfile() {
    setIsLoading(true);
    const tokenObj = await tokenRefresh(token);
    const url = BACKEND_API_URL + "/users/profile";
    fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenObj.access_token}`,
      },
    })
      .then((response) => response.json())
      .then((json) => {
        json.dob = formatDate(json.dob.split("T")[0], "-");
        setProfileData(json);
        const swimData = addMonthToSwims(json.swims);
        setSwims(swimData);
        setFiltSwims(swimData);
        setIsLoading(false);
      })
      .catch((error) => {
        setIsLoading(false);
        simpleAlert("Profile", "Failed to load profile");
      });
  }

  useEffect(() => {
    getProfile();
  }, [guid]);

  useEffect(() => {
    dispatch(
      login({ profileUrl: profileData.profileImg, name: profileData.name })
    );
  }, [profileData]);

  if (isLoading || !fontsLoaded) {
    return (
      <View>
        <NavBar navigation={navigation} />
        <ActivityIndicator style={styles.loader} size="xlarge" />
      </View>
    );
  }

  return (
    <View style={styles.app}>
      <NavBar navigation={navigation} />
      <View style={styles.profile}>
        <View style={styles.profile__text}>
          <View style={styles.profile__header}>
            <Text style={styles.profile__name}>{profileData.name}</Text>
            <Image
              source={assets[0]}
              resizeMode={"cover"}
              style={styles.profile__edit}
            ></Image>
          </View>
          <Text style={styles.profile__nickname}>{profileData.nickname}</Text>
          <Text style={styles.profile__home}>{profileData.home || ""}</Text>
          <Text style={styles.profile__bio}>{profileData.bio || ""}</Text>
        </View>
        {profileData.profileImg ? (
          <Image
            style={styles.profile__img}
            resizeMode={"cover"}
            source={{
              uri: profileData.profileImg,
            }}
          />
        ) : (
          <Image
            style={styles.profileImg}
            source={{ uri: DEFAULT_IMAGE_URL }}
          />
        )}
      </View>
      <TouchableWithoutFeedback
        onPress={() => {
          setExpand((bool) => !bool);
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        }}
      >
        <View style={styles.stats}>
          <View style={styles.stats__left}>
            <Text style={styles.stats__label}>
              <Text style={styles.stats__stat}>{swims.length}</Text> swims total
            </Text>
            <Text style={styles.stats__label}>
              <Text style={styles.stats__stat}>{swimsThisMonth(swims)}</Text>{" "}
              swims this month
            </Text>
            <Text style={styles.stats__label}>
              Last swam on{" "}
              {swims.length > 0 ? (
                <Text style={styles.stats__stat}>
                  {new Date(swims[0].date)
                    .toDateString()
                    .split(" ")
                    .slice(1, 3)
                    .join(" ")}
                </Text>
              ) : (
                <Text>...never?</Text>
              )}
            </Text>
            {!expand && (
              <TouchableOpacity>
                <Text style={styles.seeMore}>See more...</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.stats__right}>
            <Text style={styles.stats__label}>
              Loves{" "}
              <Text style={styles.stats__stat}>{favouriteSwim(swims)}</Text>
            </Text>
            <Text style={styles.stats__challenge}>
              Swim the Lakes:{"  "}
              <Text style={styles.stats__stat}>{swimTheLakes(swims)}</Text>
            </Text>
          </View>
          {expand && swims.length && (
            <View style={styles.stats__bottom}>
              {coldest(swims) && (
                <Text style={styles.stats__label}>
                  Suffered{" "}
                  <Text style={styles.stats__stat}>
                    {coldest(swims).split(",")[0]}
                  </Text>{" "}
                  on{coldest(swims).split(",").slice(1).join(", ")}
                </Text>
              )}
              {hottest(swims) && (
                <Text style={styles.stats__label}>
                  Enjoyed{" "}
                  <Text style={styles.stats__stat}>
                    {hottest(swims).split(",")[0]}
                  </Text>{" "}
                  on{hottest(swims).split(",").slice(1).join(", ")}
                </Text>
              )}
              {totalLocations(swims) && (
                <Text style={styles.stats__label}>
                  Swam in{" "}
                  <Text style={styles.stats__stat}>
                    {totalLocations(swims)}
                  </Text>{" "}
                  different locations
                </Text>
              )}
              {totalMinutes(swims) && (
                <Text style={styles.stats__label}>
                  Total immersion time:{"  "}
                  <Text style={styles.stats__stat}>{totalMinutes(swims)}</Text>
                </Text>
              )}
              {totalDistance(swims) && (
                <Text style={styles.stats__label}>
                  Total distance swam:{"  "}
                  <Text style={styles.stats__stat}>{totalDistance(swims)}</Text>
                </Text>
              )}
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
      <SwimFilter
        allSwims={swims}
        filtSwims={filtSwims}
        setFiltSwims={setFiltSwims}
      />
      <ScrollView>
        {!filtSwims.length && <Text style={styles.empty}>Nothing here!</Text>}
        {filtSwims.map((swim) => {
          return (
            <SwimRecord swim={swim} key={swim._id} navigation={navigation} />
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  app: {
    backgroundColor: colours.bg,
    height: "100%",
    width: "100%",
  },
  profile: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "nowrap",
    padding: 12,
  },
  profile__text: {
    minWidth: 0,
    width: "60%",
    margin: 2,
    padding: 0,
    color: colours.text,
  },
  profile__header: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  profile__name: {
    fontSize: 22,
    fontFamily: "Poppins-Bold",
    color: colours.text,
    height: 28,
  },
  profile__edit: {
    minHeight: 0,
    height: 20,
    width: 20,
    margin: 0,
    padding: 0,
    marginLeft: 7,
  },
  profile__nickname: {
    fontSize: 16,
    fontFamily: "Poppins-Regular",
    color: colours.lightText,
  },
  profile__home: {
    fontSize: 12,
    fontFamily: "Poppins-Light",
    color: colours.lightText,
  },
  profile__bio: {
    fontSize: 16,
    marginTop: 8,
    fontFamily: "Poppins-Regular_Italic",
    color: colours.text,
    marginRight: 6,
  },
  profile__img: {
    minWidth: 0,
    width: "38%",
    height: "auto",
    overflow: "hidden",
    borderRadius: 12,
  },
  stats: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    backgroundColor: colours.accent3Weak,
    padding: 12,
    rowGap: 12,
  },
  stats__left: {
    width: "48%",
    minWidth: 0,
  },
  stats__right: {
    width: "48%",
    minWidth: 0,
    textAlign: "right",
  },
  stats__label: {
    fontFamily: "Poppins-Light",
    color: colours.text,
  },
  stats__challenge: {
    fontFamily: "Poppins-Bold_Italic",
    color: colours.blueAccent,
  },
  stats__stat: {
    fontFamily: "Poppins-Bold",
    color: colours.text,
    overflow: "hidden",
  },
  loader: {
    height: "100%",
    position: "absolute",
    top: 350,
    left: "45%",
  },
  empty: {
    fontFamily: "Poppins-Light",
    color: colours.lightText,
    textAlign: "center",
  },
  seeMore: {
    fontFamily: "Poppins-SemiBold",
    color: colours.accent1,
    fontSize: 12,
  },
});
