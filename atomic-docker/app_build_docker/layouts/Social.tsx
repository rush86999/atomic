import {
  IoCall,
  IoGlobeOutline,
  IoLocation,
  IoLogoBehance,
  IoLogoBitbucket,
  IoLogoCodepen,
  IoLogoDiscord,
  IoLogoDribbble,
  IoLogoFacebook,
  IoLogoFoursquare,
  IoLogoGithub,
  IoLogoGitlab,
  IoLogoInstagram,
  IoLogoLinkedin,
  IoLogoMedium,
  IoLogoPinterest,
  IoLogoReddit,
  IoLogoRss,
  IoLogoSkype,
  IoLogoSlack,
  IoLogoSnapchat,
  IoLogoSoundcloud,
  IoLogoTiktok,
  IoLogoTumblr,
  IoLogoTwitter,
  IoLogoVimeo,
  IoLogoVk,
  IoLogoWhatsapp,
  IoLogoYoutube,
  IoMail,
} from "react-icons/io5";

const Social = ({ source, className }: { source: any, className: string}) => {
  const {
    facebook,
    twitter,
    instagram,
    youtube,
    linkedin,
    github,
    gitlab,
    discord,
    slack,
    medium,
    codepen,
    bitbucket,
    dribbble,
    behance,
    pinterest,
    soundcloud,
    tumblr,
    reddit,
    vk,
    whatsapp,
    snapchat,
    vimeo,
    tiktok,
    foursquare,
    rss,
    email,
    phone,
    address,
    skype,
    website,
  } = source;
  return (
    <ul className={className}>
      {facebook && (
        <li className="inline-block">
          <a
            aria-label="facebook"
            href={facebook}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            <IoLogoFacebook />
          </a>
        </li>
      )}
      {twitter && (
        <li className="inline-block">
          <a
            aria-label="twitter"
            href={twitter}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            <IoLogoTwitter />
          </a>
        </li>
      )}
      {instagram && (
        <li className="inline-block">
          <a
            aria-label="instagram"
            href={instagram}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            <IoLogoInstagram />
          </a>
        </li>
      )}
      {youtube && (
        <li className="inline-block">
          <a
            aria-label="youtube"
            href={youtube}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            <IoLogoYoutube />
          </a>
        </li>
      )}
      {linkedin && (
        <li className="inline-block">
          <a
            aria-label="linkedin"
            href={linkedin}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            <IoLogoLinkedin />
          </a>
        </li>
      )}
      {github && (
        <li className="inline-block">
          <a
            aria-label="github"
            href={github}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            <IoLogoGithub />
          </a>
        </li>
      )}
      {gitlab && (
        <li className="inline-block">
          <a
            aria-label="gitlab"
            href={gitlab}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            <IoLogoGitlab />
          </a>
        </li>
      )}
      {discord && (
        <li className="inline-block">
          <a
            aria-label="discord"
            href={discord}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            <IoLogoDiscord />
          </a>
        </li>
      )}
      {slack && (
        <li className="inline-block">
          <a
            aria-label="slack"
            href={slack}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            <IoLogoSlack />
          </a>
        </li>
      )}
      {medium && (
        <li className="inline-block">
          <a
            aria-label="medium"
            href={medium}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            <IoLogoMedium />
          </a>
        </li>
      )}
      {codepen && (
        <li className="inline-block">
          <a
            aria-label="codepen"
            href={codepen}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            <IoLogoCodepen />
          </a>
        </li>
      )}
      {bitbucket && (
        <li className="inline-block">
          <a
            aria-label="bitbucket"
            href={bitbucket}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            <IoLogoBitbucket />
          </a>
        </li>
      )}
      {dribbble && (
        <li className="inline-block">
          <a
            aria-label="dribbble"
            href={dribbble}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            <IoLogoDribbble />
          </a>
        </li>
      )}
      {behance && (
        <li className="inline-block">
          <a
            aria-label="behance"
            href={behance}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            <IoLogoBehance />
          </a>
        </li>
      )}
      {pinterest && (
        <li className="inline-block">
          <a
            aria-label="pinterest"
            href={pinterest}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            <IoLogoPinterest />
          </a>
        </li>
      )}
      {soundcloud && (
        <li className="inline-block">
          <a
            aria-label="soundcloud"
            href={soundcloud}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            <IoLogoSoundcloud />
          </a>
        </li>
      )}
      {tumblr && (
        <li className="inline-block">
          <a
            aria-label="tumblr"
            href={tumblr}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            <IoLogoTumblr />
          </a>
        </li>
      )}
      {reddit && (
        <li className="inline-block">
          <a
            aria-label="reddit"
            href={reddit}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            <IoLogoReddit />
          </a>
        </li>
      )}
      {vk && (
        <li className="inline-block">
          <a
            aria-label="vk"
            href={vk}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            <IoLogoVk />
          </a>
        </li>
      )}
      {whatsapp && (
        <li className="inline-block">
          <a
            aria-label="whatsapp"
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            <IoLogoWhatsapp />
          </a>
        </li>
      )}
      {snapchat && (
        <li className="inline-block">
          <a
            aria-label="snapchat"
            href={snapchat}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            <IoLogoSnapchat />
          </a>
        </li>
      )}
      {vimeo && (
        <li className="inline-block">
          <a
            aria-label="vimeo"
            href={vimeo}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            <IoLogoVimeo />
          </a>
        </li>
      )}
      {tiktok && (
        <li className="inline-block">
          <a
            aria-label="tiktok"
            href={tiktok}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            <IoLogoTiktok />
          </a>
        </li>
      )}
      {foursquare && (
        <li className="inline-block">
          <a
            aria-label="foursquare"
            href={foursquare}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            <IoLogoFoursquare />
          </a>
        </li>
      )}
      {skype && (
        <li className="inline-block">
          <a
            aria-label="skype"
            href={skype}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            <IoLogoSkype />
          </a>
        </li>
      )}
      {website && (
        <li className="inline-block">
          <a
            aria-label="website"
            href={website}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            <IoGlobeOutline />
          </a>
        </li>
      )}
      {rss && (
        <li className="inline-block">
          <a
            aria-label="rss feed"
            href={rss}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            <IoLogoRss />
          </a>
        </li>
      )}
      {email && (
        <li className="inline-block">
          <a aria-label="email" href={`mailto:${email}`}>
            <IoMail />
          </a>
        </li>
      )}
      {phone && (
        <li className="inline-block">
          <a aria-label="telephone" href={`tel:${phone}`}>
            <IoCall />
          </a>
        </li>
      )}
      {address && (
        <li className="inline-block">
          <a
            aria-label="location"
            href={address}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            <IoLocation />
          </a>
        </li>
      )}
    </ul>
  );
};

export default Social;
