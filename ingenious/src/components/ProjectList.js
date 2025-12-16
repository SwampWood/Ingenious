import React, { useState, useEffect, useRef } from 'react';
import './ProjectList.css';

const ProjectList = ({ projects }) => {
    const [expandedProject, setExpandedProject] = useState(null);
    const [showOptions, setShowOptions] = useState(null);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowOptions(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleProject = (id) => {
        setExpandedProject(expandedProject === id ? null : id);
    };

    const toggleOptions = (id, e) => {
        e.stopPropagation();
        setShowOptions(showOptions === id ? null : id);
    };

    const projectData = [
        {
            id: 1,
            title: 'Проект1',
            progress: 33,
            tasks: [
                { id: 1, title: 'Название задачи', status: 'completed' },
                { id: 2, title: 'Название задачи', status: 'in-progress' },
                { id: 3, title: 'Название задачи', status: 'in-progress' }
            ]
        },
        {
            id: 2,
            title: 'Проект2',
            progress: 50,
            tasks: [
                { id: 1, title: 'Название задачи', status: 'completed' },
                { id: 2, title: 'Название задачи', status: 'in-progress' }
            ]
        }
    ];

    return (
        <div className="project-list">
            {projectData.map(project => (
                <div key={project.id} className="project-card">
                    <div className="project-header">
                        <div className="project-title">{project.title}</div>
                        
                        <div className="progress-section">
                            <div className="percent">{project.progress}%</div>
                            <div className="circle" style={{background: `conic-gradient(var(--primary) 0% ${project.progress}%, #e0e0e0 ${project.progress}% 100%)`}} />
                        </div>

                        <div className="action-section">
                            <div className="more-menu">
                                <button 
                                    className="action-btn more-btn" 
                                    onClick={(e) => toggleOptions(project.id, e)}
                                >
                                    ⋯
                                </button>

                                {showOptions === project.id && (
                                    <div className="more-options" ref={menuRef}>
                                        <button className="option-btn">Информация</button>
                                        <button className="option-btn">Редактировать</button>
                                        <button className="option-btn">Участники</button>
                                        <button className="option-btn">Чат проекта</button>
                                    </div>
                                )}
                            </div>
                            
                            <button className="action-btn expand-btn" onClick={() => toggleProject(project.id)}>
                                {expandedProject === project.id ? '▲' : '▼'}
                            </button>
                        </div>
                    </div>
                    
                    {expandedProject === project.id && (
                        <div className="task-list">
                            {project.tasks.map(task => (
                                <div key={task.id} className="task-item">
                                    <span>{task.title}</span>
                                    <div className={`status ${task.status}`}>
                                        {task.status === 'completed' ? 'Выполнена' : 'В процессе'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ProjectList;