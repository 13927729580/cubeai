import {Component, OnInit} from '@angular/core';
import {ITEMS_PER_PAGE, PAGE_SIZE_OPTIONS} from '../../shared';
import {Principal} from '../../shared';
import {UmmClient} from '../service/umm_client.service';
import {Location} from '@angular/common';
import {Task} from '../model/task.model';
import {LazyLoadEvent} from 'primeng/api';
import {MessageService} from 'primeng/api';
import {ConfirmationService} from 'primeng/api';

@Component({
    templateUrl: './task-admin.component.html',
})
export class TaskAdminComponent implements OnInit {
    tasks: Task[];
    searchUserLogin: string;
    selectedTaskStatus = '全部';
    taskStatuses = [
        {label: '全部', value: '全部'},
        {label: '等待调度', value: '等待调度'},
        {label: '正在执行', value: '正在执行'},
        {label: '成功', value: '成功'},
        {label: '失败', value: '失败'}
    ];

    filter = '';
    pageSizeOptions = PAGE_SIZE_OPTIONS;
    itemsPerPage = ITEMS_PER_PAGE;
    totalItems: number;
    page = 0;
    predicate = 'id';
    reverse = false;
    loading = false;
    layout = 'list';
    pagePrefix = 'taskadmin';

    constructor(
        private principal: Principal,
        private location: Location,
        private ummClient: UmmClient,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
    ) {
    }

    ngOnInit() {
        this.restorePageState();
        this.principal.updateCurrentAccount().then(() => {
            if (!this.principal.hasAuthority('ROLE_ADMIN')) {
                this.location.back();
            }
        });
    }

    restorePageState() {
        let temp = window.localStorage.getItem(this.pagePrefix + '_itemsPerPage');
        if (temp !== null) {
            this.itemsPerPage = parseInt(temp, 10);
        }

        temp = window.localStorage.getItem(this.pagePrefix + '_page');
        if (temp !== null) {
            this.page = parseInt(temp, 10);
        }

        temp = window.localStorage.getItem(this.pagePrefix + '_predicate');
        if (temp !== null) {
            this.predicate = temp;
        }

        temp = window.localStorage.getItem(this.pagePrefix + '_reverse');
        if (temp !== null) {
            this.reverse = temp === 'true';
        }

        temp = window.localStorage.getItem(this.pagePrefix + '_layout');
        if (temp !== null) {
            this.layout = temp;
        }
    }

    backupPageState() {
        window.localStorage.setItem(this.pagePrefix + '_itemsPerPage', this.itemsPerPage.toString(10));
        window.localStorage.setItem(this.pagePrefix + '_page', this.page.toString(10));
        window.localStorage.setItem(this.pagePrefix + '_predicate', this.predicate);
        window.localStorage.setItem(this.pagePrefix + '_reverse', this.reverse.toString());
        window.localStorage.setItem(this.pagePrefix + '_layout', this.layout);
    }

    loadData() {
        const queryOptions = {};
        if (this.searchUserLogin) {
            queryOptions['userLogin'] = this.searchUserLogin;
        }
        if (this.selectedTaskStatus !== '全部') {
            queryOptions['taskStatus'] = this.selectedTaskStatus;
        }
        queryOptions['page'] = this.page;
        queryOptions['size'] = this.itemsPerPage;
        queryOptions['sort'] = this.sort();

        this.loading = true;
        this.ummClient.get_tasks(queryOptions).subscribe(
            (res) => {
                if (res.body['status'] === 'ok') {
                    this.loading = false;
                    this.totalItems = res.body['value']['total'];
                    this.tasks = res.body['value']['results'];
                } else {
                    this.loading = false;
                    this.messageService.add({severity:'error', detail:'获取任务列表失败！'});
                }
            }, () => {
                this.loading = false;
                this.messageService.add({severity:'error', detail:'网络或服务器故障！'});
            });
    }

    sort() {
        const result = [this.predicate + ',' + (this.reverse ? 'asc' : 'desc')];
        if (this.predicate !== 'id') {
            result.push('id' + ',' + (this.reverse ? 'asc' : 'desc'));
        }
        return result;
    }

    reloadPage(event: LazyLoadEvent) {
        if (event.rows) {
            this.itemsPerPage = event.rows;
            this.page = event.first / event.rows;
        }

        if (event.sortField) {
            this.predicate = event.sortField;
            this.reverse = event.sortOrder > 0;
        }

        this.backupPageState();
        this.loadData();
    }

    changeLayout(event) {
        this.layout = event.layout;
        this.backupPageState();
    }

    viewTaskDetails(task: Task) {

        if (task.taskType === '模型导入') {
            window.location.href = '/pmodelhub/#/task-onboarding/' + task.uuid + '/' + task.taskName;
        } else if (task.taskType === '模型部署') {
            window.location.href = '/pmodelhub/#/deploy/view/' + task.uuid;
        }
    }

    deleteTask(id: number) {
        this.confirmationService.confirm({
            target: event.target,
            message: '确定要删除该任务？',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: '是',
            rejectLabel: '否',
            accept: () => {
                this.ummClient.delete_task({
                    'taskId': id,
                }).subscribe(() => {
                    this.loadData();
                });
            },
            reject: () => {}
        });
    }

}
