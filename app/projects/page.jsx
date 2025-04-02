import ProjectCard from '@/components/projects/ProjectCard';

const ProjectsPage = () => {
    return (
        <div className="flex flex-col items-center h-full min-h-screen bg-white">
            <h1>Projects</h1>
            <ProjectCard />
        </div>
    );
};

export default ProjectsPage;