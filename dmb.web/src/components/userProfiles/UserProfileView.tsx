import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Profile } from "models";
import { agenticPageSx } from "styles/main_style";

type UserProfileViewProps = {
  profile: Profile;
};

export default function UserProfileView({ profile }: UserProfileViewProps) {
  return (
    <>
      <Box sx={agenticPageSx.panelBody}>
        {profile.video ? (
          <Box component="a" href={profile.video} target="_blank" rel="noopener noreferrer" sx={agenticPageSx.introLink}>
            Intro video
          </Box>
        ) : null}
        <Typography component="p" sx={agenticPageSx.summary}>
          {profile.summary}
        </Typography>
      </Box>

      <Box sx={agenticPageSx.panelBody}>
        <Typography component="h2" sx={agenticPageSx.sectionTitle}>
          Skills
        </Typography>
        <Box component="ul" sx={agenticPageSx.list}>
          {profile.skills.map((skill, index) => (
            <Box component="li" key={`${skill}-${index}`}>
              {skill}
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={agenticPageSx.panelBody}>
        <Typography component="h2" sx={agenticPageSx.sectionTitle}>
          Projects
        </Typography>
        {profile.projectCategories.map((category, index) => (
          <Box
            component="section"
            key={`${category.title}-${index}`}
            sx={index === profile.projectCategories.length - 1 ? undefined : agenticPageSx.projectSectionSpaced}
          >
            <Typography component="h3" sx={agenticPageSx.categoryTitle}>
              {category.title}
            </Typography>
            <Box component="ul" sx={agenticPageSx.list}>
              {category.items.map((item, itemIndex) => (
                <Box component="li" key={`${item.name}-${itemIndex}`}>
                  <strong>{item.name}</strong> - <span>{item.description}</span>
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>

      <Box sx={agenticPageSx.panelBody}>
        <Typography component="h2" sx={agenticPageSx.sectionTitle}>
          Contact
        </Typography>
        <Typography component="p" sx={agenticPageSx.contactLine}>
          <strong>Email:</strong> <a href={`mailto:${profile.contact.email}`}>{profile.contact.email}</a>
        </Typography>
        <Typography component="p" sx={agenticPageSx.contactLine}>
          <strong>Phone:</strong> <a href={`tel:${profile.contact.phone.replace(/\s/g, "")}`}>{profile.contact.phone}</a>
        </Typography>
      </Box>
    </>
  );
}
