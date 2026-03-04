import { Applications } from './applications';
import { NextBanner } from './banner';
import { Datasets } from './datasets';
import { ProjectsOverview } from './projects-overview';

const Home = () => {
  return (
    <section>
      <NextBanner></NextBanner>
      <section className="h-[calc(100dvh-260px)] overflow-auto px-10">
        <ProjectsOverview />
        <Datasets></Datasets>
        <Applications></Applications>
      </section>
    </section>
  );
};

export default Home;
